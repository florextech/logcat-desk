import type { Locale, LogLevelFilter, SessionStatus } from '@shared/types';

type StringFactory<TArgs extends unknown[] = []> = (...args: TArgs) => string;

export interface I18nMessages {
  common: {
    appName: string;
    panel: string;
    settings: string;
    device: string;
    more: string;
    selected: string;
    refresh: string;
    save: string;
    saving: string;
    run: string;
    english: string;
    spanish: string;
  };
  status: Record<SessionStatus, string>;
  header: {
    noDeviceSelected: string;
    selectedDevice: StringFactory<[name: string]>;
    visibleCount: StringFactory<[count: string]>;
  };
  filters: {
    title: string;
    helper: string;
    textPlaceholder: string;
    tagPlaceholder: string;
    packagePlaceholder: string;
    searchPlaceholder: string;
    levels: Record<LogLevelFilter, string>;
  };
  toolbar: {
    start: string;
    stop: string;
    pause: string;
    resume: string;
  };
  console: {
    time: string;
    level: string;
    tagPid: string;
    message: string;
    copy: string;
    logOutput: string;
  };
  empty: {
    noLogsYet: string;
    noLogsMatch: string;
    chooseDevice: string;
    startSession: string;
    relaxFilters: string;
  };
  modals: {
    actions: {
      title: string;
      intro: string;
      cleanup: string;
      export: string;
      clearViewLabel: string;
      clearViewHint: string;
      clearBufferLabel: string;
      clearBufferHint: string;
      exportVisibleLabel: string;
      exportVisibleHint: string;
      exportFullLabel: string;
      exportFullHint: string;
      copyVisibleLabel: string;
      copyVisibleHint: string;
    };
    settings: {
      title: string;
      adb: string;
      adbReady: string;
      adbMissing: string;
      adbHint: StringFactory<[path: string | null]>;
      customAdbPath: string;
      customAdbPathPlaceholder: string;
      saveAdbPath: string;
      autoScrollTitle: string;
      autoScrollHint: string;
      languageTitle: string;
      languageHint: string;
    };
    devices: {
      title: string;
      connectedCount: StringFactory<[count: number]>;
      intro: string;
      noDevices: string;
      defaultDeviceName: string;
      session: string;
    };
  };
  errors: {
    persistPreferences: string;
    refreshDevices: string;
    saveAdbPath: string;
    selectDeviceFirst: string;
    startLogcat: string;
    stopLogcat: string;
    updateCaptureState: string;
    selectDeviceBeforeClearBuffer: string;
    clearDeviceBuffer: string;
    exportLogs: string;
    copyVisibleLogs: string;
    adbUnavailable: string;
    initializeApp: string;
    sessionEndedUnexpectedly: string;
  };
}

const en: I18nMessages = {
  common: {
    appName: 'Logcat Desk',
    panel: 'Panel',
    settings: 'Settings',
    device: 'Device',
    more: 'More',
    selected: 'Selected',
    refresh: 'Refresh',
    save: 'Save',
    saving: 'Saving...',
    run: 'Run',
    english: 'English',
    spanish: 'Spanish'
  },
  status: {
    idle: 'Ready',
    starting: 'Starting logcat',
    streaming: 'Streaming logcat',
    paused: 'Capture paused',
    stopped: 'Stopped',
    error: 'Error',
    disconnected: 'Disconnected'
  },
  header: {
    noDeviceSelected: 'No device selected',
    selectedDevice: (name) => `Device: ${name}`,
    visibleCount: (count) => `${count} visible`
  },
  filters: {
    title: 'Filters',
    helper: 'Text, tag, package, search and level',
    textPlaceholder: 'Free text or stack trace',
    tagPlaceholder: 'Tag',
    packagePlaceholder: 'Package name',
    searchPlaceholder: 'Search and highlight',
    levels: {
      ALL: 'All levels',
      V: 'Verbose',
      D: 'Debug',
      I: 'Info',
      W: 'Warn',
      E: 'Error',
      F: 'Fatal'
    }
  },
  toolbar: {
    start: 'Start Live Tail',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume'
  },
  console: {
    time: 'Time',
    level: 'Lvl',
    tagPid: 'Tag / pid',
    message: 'Message',
    copy: 'Copy',
    logOutput: 'Log output'
  },
  empty: {
    noLogsYet: 'No logs yet.',
    noLogsMatch: 'No logs match the current filters.',
    chooseDevice: 'Open the Device panel and select a connected Android device.',
    startSession: 'Start capture to see logcat in real time.',
    relaxFilters: 'Relax the filters or the selected severity.'
  },
  modals: {
    actions: {
      title: 'Actions',
      intro: 'Secondary actions to clean, export or copy the current output without reloading the main interface.',
      cleanup: 'Cleanup',
      export: 'Export',
      clearViewLabel: 'Clear View',
      clearViewHint: 'Clear only the visible console.',
      clearBufferLabel: 'Clear Buffer',
      clearBufferHint: 'Clear the real device logcat buffer.',
      exportVisibleLabel: 'Export visible .txt',
      exportVisibleHint: 'Save only what is visible right now.',
      exportFullLabel: 'Export full .log',
      exportFullHint: 'Save the full captured session.',
      copyVisibleLabel: 'Copy visible',
      copyVisibleHint: 'Copy visible logs to the clipboard.'
    },
    settings: {
      title: 'Settings',
      adb: 'ADB',
      adbReady: 'ADB ready',
      adbMissing: 'ADB unavailable',
      adbHint: (path) => path ?? 'Use PATH or configure the binary path manually.',
      customAdbPath: 'Custom adb path',
      customAdbPathPlaceholder: '/opt/homebrew/bin/adb',
      saveAdbPath: 'Save ADB path',
      autoScrollTitle: 'Auto-scroll',
      autoScrollHint: 'Automatically follow new incoming logs.',
      languageTitle: 'Language',
      languageHint: 'Choose the interface language.'
    },
    devices: {
      title: 'Devices',
      connectedCount: (count) => `${count} connected`,
      intro: 'Select the device you want to work with.',
      noDevices: 'No Android devices detected.',
      defaultDeviceName: 'Android device',
      session: 'Session'
    }
  },
  errors: {
    persistPreferences: 'Failed to persist preferences.',
    refreshDevices: 'Failed to refresh devices.',
    saveAdbPath: 'Failed to save ADB path.',
    selectDeviceFirst: 'Select an Android device first.',
    startLogcat: 'Failed to start logcat.',
    stopLogcat: 'Failed to stop logcat.',
    updateCaptureState: 'Failed to update capture state.',
    selectDeviceBeforeClearBuffer: 'Select a device before clearing the logcat buffer.',
    clearDeviceBuffer: 'Failed to clear the device logcat buffer.',
    exportLogs: 'Failed to export logs.',
    copyVisibleLogs: 'Failed to copy visible logs.',
    adbUnavailable: 'ADB is not available.',
    initializeApp: 'Failed to initialize the app.',
    sessionEndedUnexpectedly: 'Logcat session ended unexpectedly.'
  }
};

const es: I18nMessages = {
  common: {
    appName: 'Logcat Desk',
    panel: 'Panel',
    settings: 'Configuracion',
    device: 'Dispositivo',
    more: 'Mas',
    selected: 'Seleccionado',
    refresh: 'Refrescar',
    save: 'Guardar',
    saving: 'Guardando...',
    run: 'Ejecutar',
    english: 'Ingles',
    spanish: 'Espanol'
  },
  status: {
    idle: 'Listo',
    starting: 'Iniciando logcat',
    streaming: 'Transmitiendo logcat',
    paused: 'Captura pausada',
    stopped: 'Detenido',
    error: 'Error',
    disconnected: 'Desconectado'
  },
  header: {
    noDeviceSelected: 'Sin dispositivo seleccionado',
    selectedDevice: (name) => `Dispositivo: ${name}`,
    visibleCount: (count) => `${count} visibles`
  },
  filters: {
    title: 'Filtros',
    helper: 'Texto, tag, paquete, busqueda y nivel',
    textPlaceholder: 'Texto libre o stack trace',
    tagPlaceholder: 'Tag',
    packagePlaceholder: 'Nombre del paquete',
    searchPlaceholder: 'Buscar y resaltar',
    levels: {
      ALL: 'Todos los niveles',
      V: 'Verbose',
      D: 'Debug',
      I: 'Info',
      W: 'Warn',
      E: 'Error',
      F: 'Fatal'
    }
  },
  toolbar: {
    start: 'Iniciar Live Tail',
    stop: 'Detener',
    pause: 'Pausar',
    resume: 'Reanudar'
  },
  console: {
    time: 'Hora',
    level: 'Lvl',
    tagPid: 'Tag / pid',
    message: 'Mensaje',
    copy: 'Copiar',
    logOutput: 'Salida'
  },
  empty: {
    noLogsYet: 'Aun no hay logs.',
    noLogsMatch: 'Ningun log coincide con los filtros actuales.',
    chooseDevice: 'Abre el panel Dispositivo y selecciona un Android conectado.',
    startSession: 'Inicia la captura para ver logcat en tiempo real.',
    relaxFilters: 'Relaja los filtros o la severidad seleccionada.'
  },
  modals: {
    actions: {
      title: 'Acciones',
      intro: 'Acciones secundarias para limpiar, exportar o copiar la salida actual sin recargar la interfaz principal.',
      cleanup: 'Limpieza',
      export: 'Exportar',
      clearViewLabel: 'Limpiar vista',
      clearViewHint: 'Vaciar solo la consola visible.',
      clearBufferLabel: 'Limpiar buffer',
      clearBufferHint: 'Limpiar el buffer real del dispositivo.',
      exportVisibleLabel: 'Exportar visible .txt',
      exportVisibleHint: 'Guardar solo lo visible ahora mismo.',
      exportFullLabel: 'Exportar completo .log',
      exportFullHint: 'Guardar la sesion completa capturada.',
      copyVisibleLabel: 'Copiar visible',
      copyVisibleHint: 'Copiar los logs visibles al portapapeles.'
    },
    settings: {
      title: 'Configuracion',
      adb: 'ADB',
      adbReady: 'ADB listo',
      adbMissing: 'ADB no disponible',
      adbHint: (path) => path ?? 'Usa PATH o configura la ruta manualmente.',
      customAdbPath: 'Ruta personalizada de adb',
      customAdbPathPlaceholder: '/opt/homebrew/bin/adb',
      saveAdbPath: 'Guardar ruta de ADB',
      autoScrollTitle: 'Auto-scroll',
      autoScrollHint: 'Seguir automaticamente los logs nuevos.',
      languageTitle: 'Idioma',
      languageHint: 'Elige el idioma de la interfaz.'
    },
    devices: {
      title: 'Dispositivos',
      connectedCount: (count) => `${count} conectados`,
      intro: 'Selecciona el dispositivo con el que quieres trabajar.',
      noDevices: 'No se detectaron dispositivos Android.',
      defaultDeviceName: 'Dispositivo Android',
      session: 'Sesion'
    }
  },
  errors: {
    persistPreferences: 'No se pudieron guardar las preferencias.',
    refreshDevices: 'No se pudo refrescar la lista de dispositivos.',
    saveAdbPath: 'No se pudo guardar la ruta de ADB.',
    selectDeviceFirst: 'Selecciona primero un dispositivo Android.',
    startLogcat: 'No se pudo iniciar logcat.',
    stopLogcat: 'No se pudo detener logcat.',
    updateCaptureState: 'No se pudo actualizar el estado de la captura.',
    selectDeviceBeforeClearBuffer: 'Selecciona un dispositivo antes de limpiar el buffer.',
    clearDeviceBuffer: 'No se pudo limpiar el buffer de logcat del dispositivo.',
    exportLogs: 'No se pudieron exportar los logs.',
    copyVisibleLogs: 'No se pudieron copiar los logs visibles.',
    adbUnavailable: 'ADB no esta disponible.',
    initializeApp: 'No se pudo inicializar la aplicacion.',
    sessionEndedUnexpectedly: 'La sesion de logcat termino inesperadamente.'
  }
};

export const messages: Record<Locale, I18nMessages> = {
  en,
  es
};
