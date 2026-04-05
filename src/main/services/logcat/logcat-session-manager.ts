import { type ChildProcessByStdio, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { Readable } from 'node:stream';
import type { LogBatchPayload, LogEntry, LogLevel, SessionState } from '@shared/types';

interface StartSessionArgs {
  adbPath: string;
  deviceId: string;
}

const THREADTIME_PATTERN =
  /^(\d\d-\d\d)\s+(\d\d:\d\d:\d\d\.\d+)\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.+?)\s*:\s(.*)$/;

export class LogcatSessionManager extends EventEmitter {
  private static readonly FORCE_KILL_TIMEOUT_MS = 1200;

  private child: ChildProcessByStdio<null, Readable, Readable> | null = null;
  private state: SessionState = { status: 'idle', deviceId: null };
  private sequence = 0;
  private expectedExitReason: 'silent' | 'stopped' | null = null;
  private partialLine = '';
  private paused = false;
  private emitQueue: LogEntry[] = [];
  private pausedQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private allEntries: LogEntry[] = [];

  getState(): SessionState {
    return this.state;
  }

  getAllLogsAsText(): string {
    return this.allEntries.map((entry) => entry.raw).join('\n');
  }

  async start({ adbPath, deviceId }: StartSessionArgs): Promise<void> {
    await this.stop(false);

    this.sequence = 0;
    this.expectedExitReason = null;
    this.partialLine = '';
    this.paused = false;
    this.emitQueue = [];
    this.pausedQueue = [];
    this.allEntries = [];

    this.updateState({
      status: 'starting',
      deviceId,
      startedAt: new Date().toISOString(),
      message: 'Starting logcat session'
    });

    const child = spawn(adbPath, ['-s', deviceId, 'logcat', '-v', 'threadtime'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.child = child;

    child.stdout.on('data', (chunk: Buffer) => {
      this.consumeChunk(chunk.toString('utf8'), deviceId);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const message = chunk.toString('utf8').trim();
      if (message) {
        this.updateState({
          status: 'error',
          deviceId,
          message
        });
      }
    });

    child.on('error', (error) => {
      this.updateState({
        status: 'error',
        deviceId,
        message: error.message
      });
    });

    child.on('spawn', () => {
      this.updateState({
        status: 'streaming',
        deviceId,
        startedAt: new Date().toISOString(),
        message: 'Streaming logcat'
      });
    });

    child.on('close', (code, signal) => {
      this.flush();
      this.child = null;

      if (this.expectedExitReason === 'silent') {
        this.expectedExitReason = null;
        return;
      }

      if (this.expectedExitReason === 'stopped') {
        this.expectedExitReason = null;
        this.updateState({
          status: 'stopped',
          deviceId: this.state.deviceId,
          message: 'Logcat session stopped'
        });
        return;
      }

      this.updateState({
        status: 'disconnected',
        deviceId: this.state.deviceId,
        message: (() => {
          if (code === 0) {
            return 'Device disconnected.';
          }

          const signalSuffix = signal ? ` (${signal})` : '';
          return `Logcat ended unexpectedly${signalSuffix}.`;
        })()
      });
    });
  }

  async stop(emitState = true): Promise<void> {
    if (!this.child) {
      if (emitState) {
        this.updateState({
          status: 'stopped',
          deviceId: this.state.deviceId,
          message: 'No active logcat session'
        });
      }
      return;
    }

    const child = this.child;
    this.expectedExitReason = emitState ? 'stopped' : 'silent';

    const closed = new Promise<void>((resolve) => {
      child.once('close', () => resolve());
    });

    child.kill('SIGTERM');

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const terminatedByTimeout = await Promise.race<boolean>([
      closed.then(() => false),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(true), LogcatSessionManager.FORCE_KILL_TIMEOUT_MS);
      })
    ]);

    if (terminatedByTimeout && this.child === child) {
      child.kill('SIGKILL');
      await closed;
    }
  }

  pause(): void {
    if (this.state.status !== 'streaming') {
      return;
    }

    this.paused = true;
    this.updateState({
      status: 'paused',
      deviceId: this.state.deviceId,
      message: 'Capture paused'
    });
  }

  resume(): void {
    if (this.state.status !== 'paused') {
      return;
    }

    this.paused = false;

    if (this.pausedQueue.length > 0) {
      this.emitQueue.push(...this.pausedQueue);
      this.pausedQueue = [];
      this.scheduleFlush();
    }

    this.updateState({
      status: 'streaming',
      deviceId: this.state.deviceId,
      message: 'Streaming logcat'
    });
  }

  private consumeChunk(chunk: string, deviceId: string): void {
    const merged = `${this.partialLine}${chunk}`;
    const lines = merged.split(/\r?\n/);
    this.partialLine = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const entry = this.parseEntry(line, deviceId);
      this.allEntries.push(entry);

      if (this.paused) {
        this.pausedQueue.push(entry);
      } else {
        this.emitQueue.push(entry);
      }
    }

    if (!this.paused && this.emitQueue.length > 0) {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, 75);
  }

  private flush(): void {
    if (this.emitQueue.length === 0) {
      return;
    }

    const payload: LogBatchPayload = {
      entries: this.emitQueue
    };

    this.emitQueue = [];
    this.emit('log-batch', payload);
  }

  private parseEntry(rawLine: string, deviceId: string): LogEntry {
    const parsed = THREADTIME_PATTERN.exec(rawLine);

    if (!parsed) {
      return {
        id: `${deviceId}-${++this.sequence}`,
        sequence: this.sequence,
        deviceId,
        raw: rawLine,
        level: 'I',
        tag: 'logcat',
        message: rawLine,
        emphasis: 'normal',
        receivedAt: new Date().toISOString()
      };
    }

    const [, monthDay, time, pid, tid, level, tag, message] = parsed;
    const emphasis =
      level === 'E' || level === 'F' || /(exception|fatal|anr)/i.test(message)
        ? 'critical'
        : level === 'W'
          ? 'warning'
          : 'normal';

    return {
      id: `${deviceId}-${++this.sequence}`,
      sequence: this.sequence,
      deviceId,
      raw: rawLine,
      monthDay,
      time,
      pid: Number(pid),
      tid: Number(tid),
      level: level as LogLevel,
      tag: tag.trim(),
      message,
      emphasis,
      receivedAt: new Date().toISOString()
    };
  }

  private updateState(state: SessionState): void {
    this.state = state;
    this.emit('session-state', state);
  }
}
