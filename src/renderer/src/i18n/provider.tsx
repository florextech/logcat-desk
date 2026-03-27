import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
  useMemo
} from 'react';
import type { Locale } from '@shared/types';
import { useAppStore } from '@renderer/store/app-store';
import { messages, type I18nMessages } from '@renderer/i18n/messages';

interface I18nContextValue {
  locale: Locale;
  copy: I18nMessages;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  copy: messages.es
});

export const I18nProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const locale = useAppStore((state) => state.settings.locale);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      copy: messages[locale]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => useContext(I18nContext);
