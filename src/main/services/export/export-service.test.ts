import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ExportService } from '@main/services/export/export-service';

describe('ExportService', () => {
  let tempDir = '';

  beforeEach(async () => {
    process.env.HOME = '/Users/tester';
    tempDir = await mkdtemp(join(tmpdir(), 'logcat-desk-export-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('exports all logs using the session manager contents', async () => {
    const filePath = join(tempDir, 'full.log');
    const dialog = {
      showSaveDialog: vi.fn().mockResolvedValue({
        canceled: false,
        filePath
      })
    };
    const sessionManager = {
      getAllLogsAsText: vi.fn().mockReturnValue('full log output')
    };

    const service = new ExportService(sessionManager as never);

    await expect(
      service.exportWithDialog(
        { scope: 'all', format: 'log', suggestedName: 'capture' },
        dialog as never
      )
    ).resolves.toEqual({
      canceled: false,
      filePath
    });

    expect(dialog.showSaveDialog).toHaveBeenCalledWith({
      title: 'Export logs',
      defaultPath: '/Users/tester/capture.log',
      filters: [{ name: 'Log files', extensions: ['log'] }]
    });
    await expect(readFile(filePath, 'utf8')).resolves.toBe('full log output');
  });

  it('exports visible logs using the provided content', async () => {
    const filePath = join(tempDir, 'visible.txt');
    const dialog = {
      showSaveDialog: vi.fn().mockResolvedValue({
        canceled: false,
        filePath
      })
    };
    const sessionManager = {
      getAllLogsAsText: vi.fn()
    };

    const service = new ExportService(sessionManager as never);

    await service.exportWithDialog(
      { scope: 'visible', format: 'txt', suggestedName: 'capture', content: 'visible only' },
      dialog as never
    );

    expect(sessionManager.getAllLogsAsText).not.toHaveBeenCalled();
    await expect(readFile(filePath, 'utf8')).resolves.toBe('visible only');
  });

  it('returns canceled when the dialog is dismissed', async () => {
    const dialog = {
      showSaveDialog: vi.fn().mockResolvedValue({
        canceled: true,
        filePath: undefined
      })
    };

    const service = new ExportService({ getAllLogsAsText: vi.fn() } as never);

    await expect(
      service.exportWithDialog(
        { scope: 'visible', format: 'txt', suggestedName: 'capture', content: 'x' },
        dialog as never
      )
    ).resolves.toEqual({ canceled: true });
  });
});
