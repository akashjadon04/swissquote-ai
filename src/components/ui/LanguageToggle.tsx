'use client';

import React from 'react';
import { useLocaleStore } from '@/store/localeStore';

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocaleStore();

  return (
    <div className="checkbox-wrapper-41" title={locale === 'fr' ? 'Switch to English' : 'Passer en français'}>
      <input 
        type="checkbox" 
        checked={locale === 'en'} 
        onChange={toggleLocale} 
        aria-label="Toggle language"
      />
    </div>
  );
}
