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
});
