import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';

describe('LogcatSessionManager internal logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses threadtime lines into structured entries', () => {
    const manager = new LogcatSessionManager();
    const entry = (
      manager as unknown as {
        parseEntry: (rawLine: string, deviceId: string) => {
          level: string;
          tag: string;
          message: string;
          pid?: number;
          tid?: number;
          emphasis: string;
        };
      }
    ).parseEntry(
      '03-27 13:00:00.456  101  201 E AndroidRuntime: Fatal exception',
      'device-1'
    );

    expect(entry).toMatchObject({
      level: 'E',
      tag: 'AndroidRuntime',
      message: 'Fatal exception',
      pid: 101,
      tid: 201,
      emphasis: 'critical'
    });
  });

  it('falls back to raw-line parsing when the format is unknown', () => {
    const manager = new LogcatSessionManager();
    const entry = (
      manager as unknown as {
        parseEntry: (rawLine: string, deviceId: string) => {
          level: string;
          tag: string;
          message: string;
        };
      }
    ).parseEntry('plain output', 'device-1');

    expect(entry).toMatchObject({
      level: 'I',
      tag: 'logcat',
      message: 'plain output'
    });
  });

  it('buffers partial chunks and emits batches on flush', async () => {
    const manager = new LogcatSessionManager();
    const batches: string[] = [];

    manager.on('log-batch', (payload) => {
      batches.push(...payload.entries.map((entry: { raw: string }) => entry.raw));
    });

    (
      manager as unknown as {
        consumeChunk: (chunk: string, deviceId: string) => void;
      }
    ).consumeChunk(
      '03-27 13:00:00.123  100  200 I ActivityManager: first\npartial',
      'device-1'
    );
    (
      manager as unknown as {
        consumeChunk: (chunk: string, deviceId: string) => void;
      }
    ).consumeChunk(' line\n', 'device-1');

    await vi.advanceTimersByTimeAsync(80);

    expect(batches).toEqual([
      '03-27 13:00:00.123  100  200 I ActivityManager: first',
      'partial line'
    ]);
    expect(manager.getAllLogsAsText()).toContain('partial line');
  });

  it('queues entries while paused and flushes them when resumed', async () => {
    const manager = new LogcatSessionManager();
    const batches: number[] = [];

    manager.on('log-batch', (payload) => {
      batches.push(payload.entries.length);
    });

    (
      manager as unknown as {
        updateState: (state: { status: 'streaming'; deviceId: string }) => void;
      }
    ).updateState({ status: 'streaming', deviceId: 'device-1' });

    manager.pause();
    (
      manager as unknown as {
        consumeChunk: (chunk: string, deviceId: string) => void;
      }
    ).consumeChunk('03-27 13:00:00.123  100  200 W ActivityManager: delayed\n', 'device-1');

    await vi.advanceTimersByTimeAsync(80);
    expect(batches).toEqual([]);

    manager.resume();
    await vi.advanceTimersByTimeAsync(80);

    expect(batches).toEqual([1]);
    expect(manager.getState().status).toBe('streaming');
  });

  it('returns a stopped state when stop is called without an active session', async () => {
    const manager = new LogcatSessionManager();

    await manager.stop();

    expect(manager.getState()).toMatchObject({
      status: 'stopped',
      message: 'No active logcat session'
    });
  });
});
