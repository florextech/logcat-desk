import { spawn } from 'node:child_process';

interface RunCommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export const runCommand = (
  command: string,
  args: string[],
  options?: { cwd?: string }
): Promise<RunCommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', reject);

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        code: code ?? 0
      });
    });
  });
