import { runCommand } from '@main/services/adb/adb-command';

const PID_COLUMN = /^\d+$/;

const parsePidMap = (stdout: string): Map<number, string> => {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const map = new Map<number, string>();

  for (const line of lines) {
    if (/^PID\s+/i.test(line) || /^USER\s+/i.test(line)) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    let pidRaw = '';
    let nameRaw = '';

    if (PID_COLUMN.test(parts[0])) {
      pidRaw = parts[0];
      nameRaw = parts[1] ?? '';
    } else if (parts.length > 8 && PID_COLUMN.test(parts[1])) {
      pidRaw = parts[1];
      nameRaw = parts[8] ?? '';
    }

    const pid = Number(pidRaw);
    const packageName = nameRaw.trim();
    if (!Number.isFinite(pid) || pid <= 0 || !packageName.includes('.')) {
      continue;
    }

    map.set(pid, packageName);
  }

  return map;
};

export class AdbPackageResolver {
  constructor(
    private readonly adbPath: string,
    private readonly deviceId: string
  ) {}

  async resolvePidMap(): Promise<Map<number, string>> {
    const modern = await runCommand(this.adbPath, ['-s', this.deviceId, 'shell', 'ps', '-A', '-o', 'PID,NAME']);
    if (modern.code === 0) {
      return parsePidMap(modern.stdout);
    }

    const legacy = await runCommand(this.adbPath, ['-s', this.deviceId, 'shell', 'ps']);
    if (legacy.code === 0) {
      return parsePidMap(legacy.stdout);
    }

    return new Map<number, string>();
  }
}
