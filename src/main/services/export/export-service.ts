import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Dialog } from 'electron';
import type { ExportLogsInput, ExportLogsResult } from '@shared/types';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';

export class ExportService {
  constructor(private readonly sessionManager: LogcatSessionManager) {}

  async exportWithDialog(
    input: ExportLogsInput,
    dialog: Dialog
  ): Promise<ExportLogsResult> {
    const extension = input.format === 'log' ? 'log' : 'txt';
    const suggestedPath = join(process.env.HOME ?? process.cwd(), `${input.suggestedName}.${extension}`);

    const result = await dialog.showSaveDialog({
      title: 'Export logs',
      defaultPath: suggestedPath,
      filters: [
        {
          name: input.format === 'log' ? 'Log files' : 'Text files',
          extensions: [extension]
        }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    const content =
      input.scope === 'all' ? this.sessionManager.getAllLogsAsText() : input.content ?? '';

    await writeFile(result.filePath, content, 'utf8');

    return {
      canceled: false,
      filePath: result.filePath
    };
  }
}
