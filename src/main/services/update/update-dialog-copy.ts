import type { Locale, UpdateCheckResult } from '@shared/types';

interface UpdateDialogCopy {
  availableTitle: string;
  availableMessage: string;
  availableDetail: string;
  openDownloadLabel: string;
  closeLabel: string;
  upToDateTitle: string;
  upToDateMessage: string;
  checkFailedTitle: string;
  checkFailedMessage: string;
}

const getBaseUpdateDialogCopy = (locale: Locale): Omit<UpdateDialogCopy, 'availableMessage' | 'upToDateMessage'> => {
  if (locale === 'es') {
    return {
      availableTitle: 'Actualizacion disponible',
      availableDetail: 'Quieres abrir la pagina de la ultima version en GitHub?',
      openDownloadLabel: 'Abrir descarga',
      closeLabel: 'Cerrar',
      upToDateTitle: 'Sin actualizaciones',
      checkFailedTitle: 'Error al buscar actualizaciones',
      checkFailedMessage: 'No se pudo completar la verificacion de actualizaciones.'
    };
  }

  return {
    availableTitle: 'Update available',
    availableDetail: 'Do you want to open the latest release page on GitHub?',
    openDownloadLabel: 'Open download',
    closeLabel: 'Close',
    upToDateTitle: 'No updates available',
    checkFailedTitle: 'Failed to check for updates',
    checkFailedMessage: 'Could not complete the update check.'
  };
};

export const getUpdateDialogCopy = (locale: Locale, result: UpdateCheckResult): UpdateDialogCopy => {
  const base = getBaseUpdateDialogCopy(locale);

  if (locale === 'es') {
    return {
      ...base,
      availableMessage: `Hay una nueva version disponible (${result.latestVersion}). Version actual: ${result.currentVersion}.`,
      upToDateMessage: `Ya estas en la ultima version (${result.currentVersion}).`
    };
  }

  return {
    ...base,
    availableMessage: `A newer version is available (${result.latestVersion}). Current version: ${result.currentVersion}.`,
    upToDateMessage: `You are already on the latest version (${result.currentVersion}).`
  };
};

export const getUpdateCheckFailedCopy = (locale: Locale): Pick<
  UpdateDialogCopy,
  'checkFailedTitle' | 'checkFailedMessage' | 'closeLabel'
> => {
  const { checkFailedTitle, checkFailedMessage, closeLabel } = getBaseUpdateDialogCopy(locale);
  return { checkFailedTitle, checkFailedMessage, closeLabel };
};
