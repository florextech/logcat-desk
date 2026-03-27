import { runCommand } from '@main/services/adb/adb-command';
import type { DeviceInfo } from '@shared/types';

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
