import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@shared/types';
import { I18nProvider, useI18n } from '@renderer/i18n/provider';
import { useAppStore } from '@renderer/store/app-store';

const Probe = () => {
  const { copy, locale } = useI18n();
  return (
    <div>
      <span>{locale}</span>
      <span>{copy.common.settings}</span>
    </div>
  );
};

describe('I18nProvider', () => {
  it('reads the locale from the store and exposes translated copy', () => {
    useAppStore.setState({
      settings: {
        ...defaultSettings,
        locale: 'en'
      }
    });

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
