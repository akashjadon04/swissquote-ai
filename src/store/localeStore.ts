import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'fr' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === 'fr' ? 'en' : 'fr' })),
    }),
    {
      name: 'AstraQuote-locale',
    }
  )
);
