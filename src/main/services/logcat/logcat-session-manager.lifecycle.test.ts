import { type ChildProcessByStdio, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';

const { spawnMockFn } = vi.hoisted(() => ({
  spawnMockFn: vi.fn()
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: spawnMockFn,
    default: {
      ...actual,
      spawn: spawnMockFn
    }
  };
});

type FakeChild = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: (signal: 'SIGTERM' | 'SIGKILL') => void;
};

const createFakeChild = (closeOnSigterm: boolean): FakeChild => {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn((signal: 'SIGTERM' | 'SIGKILL') => {
    if (closeOnSigterm && signal === 'SIGTERM') {
      child.emit('close', 0, null);
    }
  });
  return child;
};

const asSpawnedChild = (
  child: FakeChild
): ChildProcessByStdio<null, Readable, Readable> =>
  child as unknown as ChildProcessByStdio<null, Readable, Readable>;

describe('LogcatSessionManager lifecycle', () => {
  const spawnMock = vi.mocked(spawn);

  beforeEach(() => {
    vi.useFakeTimers();
    spawnMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a session, streams entries, and transitions to stopped on stop', async () => {
    const child = createFakeChild(true);
    spawnMock.mockReturnValue(asSpawnedChild(child));

    const manager = new LogcatSessionManager();
    const states: string[] = [];
    const batches: number[] = [];

    manager.on('session-state', (state) => {
      states.push(state.status);
    });
    manager.on('log-batch', (payload) => {
      batches.push(payload.entries.length);
    });

    await manager.start({
      adbPath: '/opt/homebrew/bin/adb',
      deviceId: 'device-1'
    });

    child.emit('spawn');
    child.stdout.emit(
      'data',
      Buffer.from('03-27 13:00:00.456  101  201 I ActivityManager: first entry\n')
    );

    await vi.advanceTimersByTimeAsync(80);
    expect(batches).toEqual([1]);

    await manager.stop();

    expect(states).toEqual(expect.arrayContaining(['starting', 'streaming', 'stopped']));
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    expect(spawnMock).toHaveBeenCalledWith(
      '/opt/homebrew/bin/adb',
      ['-s', 'device-1', 'logcat', '-v', 'threadtime'],
      {
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
  });

  it('reports stderr/errors and disconnected message on unexpected close', async () => {
    const child = createFakeChild(false);
    spawnMock.mockReturnValue(asSpawnedChild(child));

    const manager = new LogcatSessionManager();

    await manager.start({
      adbPath: '/adb',
      deviceId: 'device-2'
    });

    child.emit('spawn');
    child.stderr.emit('data', Buffer.from(' permission denied \n'));
    expect(manager.getState()).toMatchObject({
      status: 'error',
      message: 'permission denied'
    });

    child.emit('error', new Error('spawn failed'));
    expect(manager.getState()).toMatchObject({
      status: 'error',
      message: 'spawn failed'
    });

    child.emit('close', 1, 'SIGABRT');
    expect(manager.getState()).toMatchObject({
      status: 'disconnected',
      message: 'Logcat ended unexpectedly (SIGABRT).'
    });
  });

  it('handles normal unexpected close with code 0 and silent stop mode', async () => {
    const child = createFakeChild(true);
    spawnMock.mockReturnValue(asSpawnedChild(child));

    const manager = new LogcatSessionManager();

    await manager.start({
      adbPath: '/adb',
      deviceId: 'device-3'
    });

    child.emit('spawn');
    child.emit('close', 0, null);

    expect(manager.getState()).toMatchObject({
      status: 'disconnected',
      message: 'Device disconnected.'
    });

    const child2 = createFakeChild(true);
    spawnMock.mockReturnValueOnce(asSpawnedChild(child2));

    await manager.start({
      adbPath: '/adb',
      deviceId: 'device-3'
    });

    child2.emit('spawn');
    await manager.stop(false);

    expect(manager.getState().status).toBe('streaming');
  });

  it('does not change state when pause/resume are invoked outside valid states', () => {
    const manager = new LogcatSessionManager();

    manager.pause();
    expect(manager.getState().status).toBe('idle');

    manager.resume();
    expect(manager.getState().status).toBe('idle');
  });
});
