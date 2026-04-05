import type { AIProvider, Locale, LogLevelFilter, SessionStatus } from '@shared/types';

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
    close: string;
    english: string;
    spanish: string;
  };
  status: Record<SessionStatus, string>;
  header: {
    tagline: string;
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
    clearLogs: string;
    analyze: string;
  };
  console: {
    time: string;
    level: string;
    tagPid: string;
    message: string;
    copy: string;
    details: string;
    expand: string;
    collapse: string;
    logOutput: string;
    jumpToLatest: string;
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
      analyzeLogsLabel: string;
      analyzeLogsHint: string;
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
      maintenance: string;
      checkUpdatesLabel: string;
      checkUpdatesHint: string;
    };
    settings: {
      title: string;
      adb: string;
      generalTab: string;
      analysisTab: string;
      adbReady: string;
      adbMissing: string;
      adbHint: StringFactory<[path: string | null]>;
      customAdbPath: string;
      customAdbPathPlaceholder: string;
      saveAdbPath: string;
      autoScrollTitle: string;
      autoScrollHint: string;
      enableHighlightTitle: string;
      enableHighlightHint: string;
      enableGroupingTitle: string;
      enableGroupingHint: string;
      enableAnalysisTitle: string;
      enableAnalysisHint: string;
      enableAIEnhancementTitle: string;
      enableAIEnhancementHint: string;
      aiProviderLabel: string;
      aiProviders: Record<AIProvider, string>;
      aiApiKeyLabel: string;
      aiApiKeyPlaceholder: string;
      aiModelLabel: string;
      aiModelPlaceholder: string;
      languageTitle: string;
      languageHint: string;
    };
    analysis: {
      title: string;
      summary: string;
      probableCauses: string;
      evidence: string;
      recommendations: string;
      severity: string;
      severityLevels: Record<'low' | 'medium' | 'high' | 'critical', string>;
      aiStatus: string;
      aiStatusRuleOnly: string;
      aiStatusUsed: StringFactory<[provider: string]>;
      aiStatusFallback: StringFactory<[reason: string]>;
      aiStatusReasons: Record<'success' | 'disabled' | 'missing_api_key' | 'empty_response' | 'request_failed', string>;
      enhanceWithAI: string;
      enhancingWithAI: string;
      openAIChat: string;
      noData: string;
    };
    analysisChat: {
      title: string;
      empty: string;
      thinking: string;
      inputPlaceholder: string;
      send: string;
      failed: StringFactory<[reason: string]>;
    };
    analysisOptions: {
      title: string;
      intro: StringFactory<[count: number]>;
      selectedScopeLabel: string;
      selectedScopeHint: string;
      selectedScopeDisabledHint: string;
      lastVisibleScopeLabel: string;
      lastVisibleScopeHint: string;
      allVisibleScopeLabel: string;
      allVisibleScopeHint: string;
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
    checkForUpdates: string;
    adbUnavailable: string;
    initializeApp: string;
    sessionEndedUnexpectedly: string;
    analyzeLogs: string;
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
    close: 'Close',
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
    tagline: 'Android log streaming and filtering',
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
    resume: 'Resume',
    clearLogs: 'Clear logs',
    analyze: 'Analyze'
  },
  console: {
    time: 'Time',
    level: 'Lvl',
    tagPid: 'Tag / pid',
    message: 'Message',
    copy: 'Copy',
    details: 'Detail',
    expand: 'Expand',
    collapse: 'Collapse',
    logOutput: 'Log output',
    jumpToLatest: 'Jump to latest log'
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
      analyzeLogsLabel: 'Analyze logs',
      analyzeLogsHint: 'Run deterministic diagnostics and optional AI summary enhancement.',
      clearViewLabel: 'Clear View',
      clearViewHint: 'Clear only the visible console.',
      clearBufferLabel: 'Clear Buffer',
      clearBufferHint: 'Clear the real device logcat buffer.',
      exportVisibleLabel: 'Export visible .txt',
      exportVisibleHint: 'Save only what is visible right now.',
      exportFullLabel: 'Export full .log',
      exportFullHint: 'Save the full captured session.',
      copyVisibleLabel: 'Copy visible',
      copyVisibleHint: 'Copy visible logs to the clipboard.',
      maintenance: 'Maintenance',
      checkUpdatesLabel: 'Check for updates',
      checkUpdatesHint: 'Check GitHub for the latest available release.'
    },
    settings: {
      title: 'Settings',
      adb: 'ADB',
      generalTab: 'General',
      analysisTab: 'Analysis & AI',
      adbReady: 'ADB ready',
      adbMissing: 'ADB unavailable',
      adbHint: (path) => path ?? 'Use PATH or configure the binary path manually.',
      customAdbPath: 'Custom adb path',
      customAdbPathPlaceholder: '/opt/homebrew/bin/adb',
      saveAdbPath: 'Save ADB path',
      autoScrollTitle: 'Auto-scroll',
      autoScrollHint: 'Automatically follow new incoming logs.',
      enableHighlightTitle: 'Smart highlight',
      enableHighlightHint: 'Auto-classify and emphasize important errors and warnings.',
      enableGroupingTitle: 'Error grouping',
      enableGroupingHint: 'Group similar logs and allow expanding each group.',
      enableAnalysisTitle: 'Intelligent analysis',
      enableAnalysisHint: 'Enable deterministic rule-based diagnostics for current logs.',
      enableAIEnhancementTitle: 'AI summary enhancement',
      enableAIEnhancementHint: 'Optionally improve the summary text using an external AI provider.',
      aiProviderLabel: 'AI provider',
      aiProviders: {
        openai: 'OpenAI',
        gemini: 'Gemini',
        openrouter: 'OpenRouter',
        claude: 'Claude'
      },
      aiApiKeyLabel: 'API key',
      aiApiKeyPlaceholder: 'Enter API key',
      aiModelLabel: 'Model (optional)',
      aiModelPlaceholder: 'Leave blank to use provider default model',
      languageTitle: 'Language',
      languageHint: 'Choose the interface language.'
    },
    analysis: {
      title: 'Log Analysis',
      summary: 'Summary',
      probableCauses: 'Probable causes',
      evidence: 'Evidence',
      recommendations: 'Recommendations',
      severity: 'Severity',
      severityLevels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      },
      aiStatus: 'AI enhancement',
      aiStatusRuleOnly: 'Rule-based only',
      aiStatusUsed: (provider) => `Used ${provider}`,
      aiStatusFallback: (reason) => `Fallback to rules (${reason})`,
      aiStatusReasons: {
        success: 'applied',
        disabled: 'disabled',
        missing_api_key: 'missing API key',
        empty_response: 'empty response',
        request_failed: 'provider request failed'
      },
      enhanceWithAI: 'Generate AI response',
      enhancingWithAI: 'Generating...',
      openAIChat: 'Open AI chat',
      noData: 'No analysis data available.'
    },
    analysisChat: {
      title: 'AI Chat',
      empty: 'No messages yet. Ask about probable causes, evidence, or next steps.',
      thinking: 'Thinking...',
      inputPlaceholder: 'Ask a follow-up question...',
      send: 'Send',
      failed: (reason) => `AI request failed: ${reason}`
    },
    analysisOptions: {
      title: 'Analyze Logs',
      intro: (count) => `Analyze the latest visible logs from the current filtered set (${count}).`,
      selectedScopeLabel: 'Selected log',
      selectedScopeHint: 'Analyze only the currently selected row.',
      selectedScopeDisabledHint: 'Select a log row first to enable this option.',
      lastVisibleScopeLabel: 'Last visible logs',
      lastVisibleScopeHint: 'Analyze only the most recent visible logs based on your filters.',
      allVisibleScopeLabel: 'All visible logs',
      allVisibleScopeHint: 'Analyze all logs currently visible in the table.'
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
    checkForUpdates: 'Failed to check for updates.',
    adbUnavailable: 'ADB is not available.',
    initializeApp: 'Failed to initialize the app.',
    sessionEndedUnexpectedly: 'Logcat session ended unexpectedly.',
    analyzeLogs: 'Failed to analyze logs.'
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
    close: 'Cerrar',
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
    tagline: 'Streaming y filtros de logs Android',
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
    resume: 'Reanudar',
    clearLogs: 'Limpiar logs',
    analyze: 'Analizar'
  },
  console: {
    time: 'Hora',
    level: 'Lvl',
    tagPid: 'Tag / pid',
    message: 'Mensaje',
    copy: 'Copiar',
    details: 'Detalle',
    expand: 'Expandir',
    collapse: 'Colapsar',
    logOutput: 'Salida',
    jumpToLatest: 'Ir al ultimo log'
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
      analyzeLogsLabel: 'Analizar logs',
      analyzeLogsHint: 'Ejecutar diagnostico deterministico y mejora opcional del resumen con AI.',
      clearViewLabel: 'Limpiar vista',
      clearViewHint: 'Vaciar solo la consola visible.',
      clearBufferLabel: 'Limpiar buffer',
      clearBufferHint: 'Limpiar el buffer real del dispositivo.',
      exportVisibleLabel: 'Exportar visible .txt',
      exportVisibleHint: 'Guardar solo lo visible ahora mismo.',
      exportFullLabel: 'Exportar completo .log',
      exportFullHint: 'Guardar la sesion completa capturada.',
      copyVisibleLabel: 'Copiar visible',
      copyVisibleHint: 'Copiar los logs visibles al portapapeles.',
      maintenance: 'Mantenimiento',
      checkUpdatesLabel: 'Buscar actualizaciones',
      checkUpdatesHint: 'Revisar en GitHub si hay una version mas reciente.'
    },
    settings: {
      title: 'Configuracion',
      adb: 'ADB',
      generalTab: 'General',
      analysisTab: 'Analisis e IA',
      adbReady: 'ADB listo',
      adbMissing: 'ADB no disponible',
      adbHint: (path) => path ?? 'Usa PATH o configura la ruta manualmente.',
      customAdbPath: 'Ruta personalizada de adb',
      customAdbPathPlaceholder: '/opt/homebrew/bin/adb',
      saveAdbPath: 'Guardar ruta de ADB',
      autoScrollTitle: 'Auto-scroll',
      autoScrollHint: 'Seguir automaticamente los logs nuevos.',
      enableHighlightTitle: 'Resaltado inteligente',
      enableHighlightHint: 'Clasificar y enfatizar automaticamente errores y advertencias importantes.',
      enableGroupingTitle: 'Agrupar errores',
      enableGroupingHint: 'Agrupar logs similares y permitir expandir cada grupo.',
      enableAnalysisTitle: 'Analisis inteligente',
      enableAnalysisHint: 'Activar diagnostico deterministico basado en reglas para los logs actuales.',
      enableAIEnhancementTitle: 'Mejora de resumen con AI',
      enableAIEnhancementHint: 'Mejorar opcionalmente el resumen usando un proveedor de AI externo.',
      aiProviderLabel: 'Proveedor de AI',
      aiProviders: {
        openai: 'OpenAI',
        gemini: 'Gemini',
        openrouter: 'OpenRouter',
        claude: 'Claude'
      },
      aiApiKeyLabel: 'API key',
      aiApiKeyPlaceholder: 'Ingresa API key',
      aiModelLabel: 'Modelo (opcional)',
      aiModelPlaceholder: 'Deja vacio para usar el modelo por defecto del proveedor',
      languageTitle: 'Idioma',
      languageHint: 'Elige el idioma de la interfaz.'
    },
    analysis: {
      title: 'Analisis de logs',
      summary: 'Resumen',
      probableCauses: 'Causas probables',
      evidence: 'Evidencia',
      recommendations: 'Recomendaciones',
      severity: 'Severidad',
      severityLevels: {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        critical: 'Critica'
      },
      aiStatus: 'Mejora con AI',
      aiStatusRuleOnly: 'Solo reglas',
      aiStatusUsed: (provider) => `Se uso ${provider}`,
      aiStatusFallback: (reason) => `Fallback a reglas (${reason})`,
      aiStatusReasons: {
        success: 'aplicado',
        disabled: 'desactivada',
        missing_api_key: 'falta API key',
        empty_response: 'respuesta vacia',
        request_failed: 'fallo la solicitud al proveedor'
      },
      enhanceWithAI: 'Generar respuesta con IA',
      enhancingWithAI: 'Generando...',
      openAIChat: 'Abrir chat IA',
      noData: 'No hay datos de analisis disponibles.'
    },
    analysisChat: {
      title: 'Chat IA',
      empty: 'Aun no hay mensajes. Pregunta por causas probables, evidencia o siguientes pasos.',
      thinking: 'Pensando...',
      inputPlaceholder: 'Escribe una pregunta de seguimiento...',
      send: 'Enviar',
      failed: (reason) => `Fallo la solicitud IA: ${reason}`
    },
    analysisOptions: {
      title: 'Analizar logs',
      intro: (count) => `Analiza los ultimos logs visibles del conjunto filtrado actual (${count}).`,
      selectedScopeLabel: 'Log seleccionado',
      selectedScopeHint: 'Analizar solo la fila seleccionada actualmente.',
      selectedScopeDisabledHint: 'Selecciona una fila de log para habilitar esta opcion.',
      lastVisibleScopeLabel: 'Ultimos logs visibles',
      lastVisibleScopeHint: 'Analizar solo los logs visibles mas recientes segun tus filtros.',
      allVisibleScopeLabel: 'Todos los visibles',
      allVisibleScopeHint: 'Analizar todos los logs visibles actualmente en la tabla.'
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
    checkForUpdates: 'No se pudo verificar si hay actualizaciones.',
    adbUnavailable: 'ADB no esta disponible.',
    initializeApp: 'No se pudo inicializar la aplicacion.',
    sessionEndedUnexpectedly: 'La sesion de logcat termino inesperadamente.',
    analyzeLogs: 'No se pudieron analizar los logs.'
  }
};

export const messages: Record<Locale, I18nMessages> = {
  en,
  es
};
