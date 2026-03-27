import { describe, expect, it } from 'vitest';
import { runCommand } from '@main/services/adb/adb-command';

describe('runCommand', () => {
  it('collects stdout and stderr until the process exits', async () => {
    await expect(
      runCommand(process.execPath, [
        '-e',
        "process.stdout.write('hello '); process.stderr.write('warn'); process.stdout.write('world'); process.exit(3);"
      ])
    ).resolves.toEqual({
      stdout: 'hello world',
      stderr: 'warn',
      code: 3
    });
  });

  it('returns code zero when the child exits successfully', async () => {
    await expect(
      runCommand(process.execPath, ['-e', "process.stdout.write('ok');"])
    ).resolves.toEqual({
      stdout: 'ok',
      stderr: '',
      code: 0
    });
  });

  it('rejects when the process cannot be spawned', async () => {
    await expect(runCommand('/definitely/missing-command', [])).rejects.toThrow();
  });
});
