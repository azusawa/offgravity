'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { ja } from '../locales/ja';

export type Locale = 'ko' | 'en' | 'ja';

const dictionaries = { ko, en, ja };
const LOCALE_STORAGE_KEY = 'life-os-locale';

interface TranslationContextType {
  locale: Locale;
  changeLocale: (nextLocale: Locale) => void;
  t: (keyPath: string, replacements?: Record<string, string | number>) => any;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

/**
 * Life OS Dashboard - TranslationProvider
 * 
 * [역할]
 * 1. 어플리케이션 전역 언어 상태('ko' | 'en' | 'ja')와 번역 함수 t를 Context로 바인딩합니다.
 * 2. 이를 통해 언어 셀렉터 토글 시 모든 영역(사이드바 메뉴, 각 탭 컨텐츠)이 즉각 리렌더링되어 다국어가 바로 반영됩니다.
 * 3. React 19 cascading renders 방어를 위한 setTimeout 마운트 처리를 탑재했습니다.
 */
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko');

  // 마운트 시 저장된 로케일 복원
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
          if (stored && (stored === 'ko' || stored === 'en' || stored === 'ja')) {
            setLocaleState(stored);
          }
        } catch (err) {
          console.error('로케일 로드 실패:', err);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const changeLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      } catch (err) {
        console.error('로케일 저장 실패:', err);
      }
    }
  }, []);

  const t = useCallback(
    (keyPath: string, replacements?: Record<string, string | number>): any => {
      const keys = keyPath.split('.');
      let currentObj: unknown = dictionaries[locale];

      for (const key of keys) {
        if (currentObj && typeof currentObj === 'object' && key in (currentObj as Record<string, unknown>)) {
          currentObj = (currentObj as Record<string, unknown>)[key];
        } else {
          return keyPath;
        }
      }

      if (typeof currentObj !== 'string' && !Array.isArray(currentObj)) {
        return keyPath;
      }

      if (Array.isArray(currentObj)) {
        return currentObj;
      }

      let text = currentObj as string;
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }

      return text;
    },
    [locale]
  );

  return (
    <TranslationContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Life OS Dashboard - useTranslation 커스텀 훅
 * 
 * [역할]
 * 1. TranslationProvider 가 제공하는 전역 번역 컨텍스트를 구독하여 locale, changeLocale, t 를 반환합니다.
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
