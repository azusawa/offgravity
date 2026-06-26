/**
 * Life OS Dashboard - 테마 관련 타입 정의
 * 
 * [설명]
 * 애플리케이션 전반에서 사용되는 테마 모드에 대한 TypeScript 타입을 선언합니다.
 * 지원하는 테마는 총 3가지입니다:
 * 1. light: 기본 밝은 화면 테마
 * 2. dark: 기본 어두운 화면 테마
 * 3. gravity-free: 무중력 콘셉트의 특수 테마 (글래스모피즘 및 플로팅 애니메이션 활성화)
 */

// 테마 리터럴 타입 선언
export type Theme = 'light' | 'dark';

// 테마 컨텍스트에서 공급할 데이터의 인터페이스
export interface ThemeContextType {
  // 현재 적용된 테마 상태
  theme: Theme;
  // 테마를 변경하는 상태 변경 함수
  setTheme: (theme: Theme) => void;
}
