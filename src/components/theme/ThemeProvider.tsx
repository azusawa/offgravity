'use client';

import React, { createContext, useContext } from 'react';
import { ThemeContextType } from '@/types/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Life OS Dashboard - 테마 콘텍스트 선언
 * 
 * [설명]
 * React Context API를 통해 애플리케이션 트리의 어느 깊이에서나
 * 현재 테마 정보를 읽고 변경할 수 있는 채널을 마련합니다.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider 컴포넌트
 * 
 * [역할]
 * 루트 레이아웃에서 하위 트리를 감싸, 모든 자식 컴포넌트가
 * 테마 상태와 테마를 변경할 수 있는 함수에 접근할 수 있도록 Context.Provider를 전달합니다.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useTheme 커스텀 훅으로부터 테마 및 상태 제어 함수 호출
  const { theme, setTheme } = useTheme();

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useThemeContext 커스텀 훅
 * 
 * [역할]
 * 개별 컴포넌트에서 테마를 참조하거나 변경할 때 useContext(ThemeContext)를
 * 매번 작성하지 않고 편리하게 원클릭으로 꺼내 쓸 수 있도록 돕는 헬퍼 훅입니다.
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext는 반드시 ThemeProvider 하위 컴포넌트 내부에서 호출되어야 합니다.');
  }
  
  return context;
}
