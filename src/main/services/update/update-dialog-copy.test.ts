import { describe, expect, it } from 'vitest';
import { getUpdateDialogCopy } from '@main/services/update/update-dialog-copy';

const updateResult = {
  currentVersion: '0.1.0',
  latestVersion: '0.2.0',
  hasUpdate: true,
  releaseUrl: 'https://github.com/florextech/logcat-desk/releases/tag/v0.2.0'
};

describe('update dialog copy', () => {
  it('returns spanish copy for update dialogs', () => {
    const copy = getUpdateDialogCopy('es', updateResult);

    expect(copy.availableTitle).toBe('Actualizacion disponible');
    expect(copy.upToDateTitle).toBe('Sin actualizaciones');
    expect(copy.checkFailedTitle).toBe('Error al buscar actualizaciones');
  });

  it('returns english copy for update dialogs', () => {
    const copy = getUpdateDialogCopy('en', updateResult);

    expect(copy.availableTitle).toBe('Update available');
    expect(copy.upToDateTitle).toBe('No updates available');
    expect(copy.checkFailedTitle).toBe('Failed to check for updates');
  });
});
