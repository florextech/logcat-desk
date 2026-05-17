import { describe, expect, it } from 'vitest';
import { messages } from '@renderer/i18n/messages';

describe('i18n messages', () => {
  it('provides localized dynamic copy for english and spanish', () => {
    expect(messages.en.header.selectedDevice('Pixel')).toBe('Device: Pixel');
    expect(messages.es.header.selectedDevice('Pixel')).toBe('Dispositivo: Pixel');
    expect(messages.en.header.visibleCount('25')).toBe('25 visible');
    expect(messages.es.header.visibleCount('25')).toBe('25 visibles');
  });

  it('provides settings and device modal helpers', () => {
    expect(messages.en.modals.settings.adbHint(null)).toContain('Use PATH');
    expect(messages.es.modals.settings.adbHint(null)).toContain('Usa PATH');
    expect(messages.en.modals.devices.connectedCount(2)).toBe('2 connected');
    expect(messages.es.modals.devices.connectedCount(2)).toBe('2 conectados');
  });

  it('provides localized preset and json export copy', () => {
    expect(messages.en.filters.savePreset).toBe('Save preset');
    expect(messages.es.filters.savePreset).toBe('Guardar preset');
    expect(messages.en.filters.presetNamePlaceholder).toBe('Preset name');
    expect(messages.es.filters.presetNamePlaceholder).toBe('Nombre del preset');
    expect(messages.en.filters.deletePresetAria('Crash')).toBe('Delete Crash');
    expect(messages.es.filters.deletePresetAria('Crash')).toBe('Eliminar Crash');
    expect(messages.en.header.projectLabel('abc')).toBe('Project: abc');
    expect(messages.es.header.projectLabel('abc')).toBe('Proyecto: abc');
    expect(messages.en.modals.actions.exportVisibleJsonLabel).toBe('Export visible .json');
    expect(messages.es.modals.actions.exportVisibleJsonLabel).toBe('Exportar visible .json');
  });
});
