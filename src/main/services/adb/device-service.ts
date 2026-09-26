import { runCommand } from '@main/services/adb/adb-command';
import type { DeviceInfo, DevicePerformanceSnapshot, DeviceProcessUsage } from '@shared/types';

const parseDeviceLine = (line: string): DeviceInfo | null => {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  const [id, state, ...metaParts] = parts;
  if (!id || !state || state === 'List') {
    return null;
  }

  const metadata = new Map<string, string>();
  metaParts.forEach((part) => {
    const [key, value] = part.split(':');
    if (key && value) {
      metadata.set(key, value);
    }
  });

  return {
    id,
    state,
    model: metadata.get('model')?.replaceAll('_', ' '),
    product: metadata.get('product')?.replaceAll('_', ' '),
    transportId: metadata.get('transport_id'),
    deviceName: metadata.get('device')?.replaceAll('_', ' ')
  };
};

export const listDevices = async (adbPath: string): Promise<DeviceInfo[]> => {
  const result = await runCommand(adbPath, ['devices', '-l']);

  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || 'Failed to list Android devices.');
  }

  return result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map(parseDeviceLine)
    .filter((device): device is DeviceInfo => Boolean(device))
    .sort((left, right) => left.id.localeCompare(right.id));
};

export const clearLogcatBuffer = async (adbPath: string, deviceId: string): Promise<void> => {
  const result = await runCommand(adbPath, ['-s', deviceId, 'logcat', '-c']);

  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || 'Failed to clear the device logcat buffer.');
  }
};

const runAdbShell = async (adbPath: string, deviceId: string, command: string): Promise<string> => {
  const result = await runCommand(adbPath, ['-s', deviceId, 'shell', command]);
  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || `Failed to run adb shell command: ${command}`);
  }

  return result.stdout;
};

const parseLoadAverages = (cpuInfoOutput: string): { load1: number; load5: number; load15: number } => {
  const match = cpuInfoOutput.match(/Load:\s*([\d.]+)\s*\/\s*([\d.]+)\s*\/\s*([\d.]+)/i);
  if (!match) {
    return { load1: 0, load5: 0, load15: 0 };
  }

  return {
    load1: Number(match[1] ?? 0),
    load5: Number(match[2] ?? 0),
    load15: Number(match[3] ?? 0)
  };
};

const parseCpuTotals = (cpuInfoOutput: string): {
  total: number;
  user: number;
  kernel: number;
  iowait: number;
} => {
  const processTotal = cpuInfoOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => Number(line.match(/^([\d.]+)%\s+\d+\//)?.[1] ?? 0))
    .reduce((accumulator, value) => accumulator + value, 0);

  const totalLine = cpuInfoOutput
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith('TOTAL:'));

  if (!totalLine) {
    return { total: Number(processTotal.toFixed(1)), user: 0, kernel: 0, iowait: 0 };
  }

  const totalFromLine = Array.from(totalLine.matchAll(/([\d.]+)%/g))
    .map((match) => Number(match[1] ?? 0))
    .reduce((accumulator, value) => accumulator + value, 0);
  const total = totalFromLine > 0 ? totalFromLine : processTotal;
  const user = Number(totalLine.match(/([\d.]+)%\s*user/i)?.[1] ?? 0);
  const kernel = Number(totalLine.match(/([\d.]+)%\s*kernel/i)?.[1] ?? 0);
  const iowait = Number(totalLine.match(/([\d.]+)%\s*iowait/i)?.[1] ?? 0);

  return { total, user, kernel, iowait };
};

const parseTopProcesses = (cpuInfoOutput: string): DeviceProcessUsage[] =>
  cpuInfoOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^([\d.]+)%\s+(\d+)\/([^:\s]+)(?::|\s|$)/);
      if (!match) {
        return null;
      }

      return {
        cpuPercent: Number(match[1] ?? 0),
        pid: Number(match[2] ?? 0),
        name: String(match[3] ?? 'unknown'),
        rssKb: null
      } as DeviceProcessUsage;
    })
    .filter((entry): entry is DeviceProcessUsage => Boolean(entry))
    .sort((left, right) => right.cpuPercent - left.cpuPercent)
    .slice(0, 8);

const parseMemInfo = (memInfoOutput: string): {
  memTotalKb: number;
  memFreeKb: number;
  memAvailableKb: number;
  swapTotalKb: number;
  swapFreeKb: number;
} => {
  const parseLine = (key: string): number => {
    const line = memInfoOutput
      .split(/\r?\n/)
      .find((entry) => entry.toLowerCase().startsWith(key.toLowerCase()));
    if (!line) {
      return 0;
    }

    return Number(line.match(/:\s*(\d+)/)?.[1] ?? 0);
  };

  return {
    memTotalKb: parseLine('MemTotal'),
    memFreeKb: parseLine('MemFree'),
    memAvailableKb: parseLine('MemAvailable'),
    swapTotalKb: parseLine('SwapTotal'),
    swapFreeKb: parseLine('SwapFree')
  };
};

const toMb = (kb: number): number => Number((kb / 1024).toFixed(1));

export const getDevicePerformanceSnapshot = async (
  adbPath: string,
  deviceId: string
): Promise<DevicePerformanceSnapshot> => {
  const [cpuInfoOutput, memInfoOutput, uptimeOutput] = await Promise.all([
    runAdbShell(adbPath, deviceId, 'dumpsys cpuinfo'),
    runAdbShell(adbPath, deviceId, 'cat /proc/meminfo'),
    runAdbShell(adbPath, deviceId, 'cat /proc/uptime')
  ]);

  const load = parseLoadAverages(cpuInfoOutput);
  const cpuTotals = parseCpuTotals(cpuInfoOutput);
  const topProcesses = parseTopProcesses(cpuInfoOutput);
  const mem = parseMemInfo(memInfoOutput);
  const parsedUptime = Number(uptimeOutput.trim().split(/\s+/)[0] ?? 0);
  const uptimeSeconds = Number.isFinite(parsedUptime) ? Math.max(0, Math.floor(parsedUptime)) : 0;
  const swapUsedKb = Math.max(mem.swapTotalKb - mem.swapFreeKb, 0);
  const memoryUsedKb = Math.max(mem.memTotalKb - mem.memFreeKb, 0);

  return {
    timestamp: new Date().toISOString(),
    deviceId,
    cpuTotalPercent: Number(cpuTotals.total.toFixed(1)),
    cpuUserPercent: Number(cpuTotals.user.toFixed(1)),
    cpuKernelPercent: Number(cpuTotals.kernel.toFixed(1)),
    cpuIoWaitPercent: Number(cpuTotals.iowait.toFixed(1)),
    memoryUsedMb: toMb(memoryUsedKb),
    memoryFreeMb: toMb(mem.memFreeKb),
    memoryAvailableMb: toMb(mem.memAvailableKb),
    memoryTotalMb: toMb(mem.memTotalKb),
    swapUsedMb: toMb(swapUsedKb),
    swapTotalMb: toMb(mem.swapTotalKb),
    loadAverage1m: Number(load.load1.toFixed(2)),
    loadAverage5m: Number(load.load5.toFixed(2)),
    loadAverage15m: Number(load.load15.toFixed(2)),
    uptimeSeconds,
    topProcesses
  };
};
