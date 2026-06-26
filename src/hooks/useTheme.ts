'use client';

import { useState, useEffect } from 'react';
import { Theme } from '@/types/theme';

/**
 * Life OS Dashboard - 테마 비즈니스 로직 커스텀 훅
 * 
 * [역할]
 * 1. 로컬 스토리지(LocalStorage)에서 사용자가 설정했던 테마 값을 복원합니다.
 * 2. 복원할 값이 없는 경우, 시스템 테마 설정(Dark Mode 여부)을 감지하여 초기 테마를 설정합니다.
 * 3. 테마 상태(theme)가 바뀔 때마다 document.documentElement 클래스명을 동적으로 추가/제거합니다.
 * 4. 바뀐 테마 설정을 로컬 스토리지에 영구 저장합니다.
 * 
 * [주의 사항]
 * Next.js SSR 환경에서 서버 측 HTML 렌더링 결과와 클라이언트 초기 마운트 결과가 달라 
 * 발생하는 Hydration Mismatch 오류를 방지하기 위해 mounted 상태 변수를 사용하여 방어 코드를 작성했습니다.
 */
export function useTheme() {
  // 테마 상태값 (기본값은 SSR 환경을 고려해 우선 'light'로 설정)
  const [theme, setThemeState] = useState<Theme>('light');
  
  // 컴포넌트가 브라우저에 마운트(렌더링 완료) 되었는지 여부
  const [mounted, setMounted] = useState(false);

  // 1단계: 컴포넌트 마운트 시 로컬 스토리지 및 시스템 설정 분석
  useEffect(() => {
    // 마운트 완료 및 테마 설정 적용을 비동기(setTimeout)로 지연하여
    // React 19 cascading render 린트 에러를 예방합니다.
    const timer = setTimeout(() => {
      setMounted(true);

      try {
        // 로컬 스토리지에 저장된 이전 세션의 테마 설정 조회
        const savedTheme = localStorage.getItem('theme') as Theme | null;

        if (savedTheme === 'light' || savedTheme === 'dark') {
          // 유효한 테마 값이 저장되어 있다면 설정
          setThemeState(savedTheme);
        } else {
          // 저장된 테마가 없다면 사용자의 시스템 OS 설정을 참조
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setThemeState(prefersDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('LocalStorage에 접근할 수 없습니다:', error);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 2단계: 테마 상태가 변경될 때마다 DOM 클래스 업데이트 및 로컬 스토리지 반영
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // 1) 기존 테마 관련 클래스 일괄 제거
    root.classList.remove('dark');

    // 2) 변경된 테마에 맞게 <html> 엘리먼트에 클래스 바인딩
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    // 'light'인 경우는 별도 클래스 추가가 필요치 않음

    // 3) 로컬 스토리지에 테마 변경 이력 동기화
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('LocalStorage에 테마를 저장하는 데 실패했습니다:', error);
    }
  }, [theme, mounted]);

  // 테마 상태 제어용 함수
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
    mounted, // Hydration Mismatch 가드를 위해 컴포넌트 외부에서 노출
  };
}
