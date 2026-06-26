'use client';

import { useState, useEffect } from 'react';

export interface HolidaySettings {
  showKR: boolean;
  showJP: boolean;
  showUS: boolean;
  toggleKR: () => void;
  toggleJP: () => void;
  toggleUS: () => void;
}

/**
 * Life OS Dashboard - useHolidaySettings 커스텀 훅
 * [설명] 대한민국(KR), 일본(JP), 미국(US) 공휴일 표시 토글 설정을 LocalStorage에 보존합니다.
 */
export function useHolidaySettings(): HolidaySettings {
  const STORAGE_KEY = 'life-os-holiday-settings';

  const [showKR, setShowKR] = useState(true);
  const [showJP, setShowJP] = useState(true);
  const [showUS, setShowUS] = useState(true);

  // 마운트 시 로컬스토리지로부터 값 복원
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (typeof parsed.showKR === 'boolean') setShowKR(parsed.showKR);
            if (typeof parsed.showJP === 'boolean') setShowJP(parsed.showJP);
            if (typeof parsed.showUS === 'boolean') setShowUS(parsed.showUS);
          }
        } catch (err) {
          console.error('공휴일 설정 로드 실패:', err);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveSettings = (kr: boolean, jp: boolean, us: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ showKR: kr, showJP: jp, showUS: us }));
      } catch (err) {
        console.error('공휴일 설정 저장 실패:', err);
      }
    }
  };

  const toggleKR = () => {
    setShowKR((prev) => {
      const next = !prev;
      saveSettings(next, showJP, showUS);
      return next;
    });
  };

  const toggleJP = () => {
    setShowJP((prev) => {
      const next = !prev;
      saveSettings(showKR, next, showUS);
      return next;
    });
  };

  const toggleUS = () => {
    setShowUS((prev) => {
      const next = !prev;
      saveSettings(showKR, showJP, next);
      return next;
    });
  };

  return {
    showKR,
    showJP,
    showUS,
    toggleKR,
    toggleJP,
    toggleUS
  };
}
