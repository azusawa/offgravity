import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from './useTheme';

/**
 * Life OS Dashboard - 테마 비즈니스 로직 단위 테스트 하네스
 * 
 * [검증 목적]
 * 1. 클라이언트 사이드 마운트 후 로컬스토리지를 정확히 읽어오는지 테스트합니다.
 * 2. 로컬스토리지가 비어있을 시 시스템 설정(다크모드 여부)을 정상 폴백하는지 검사합니다.
 * 3. setTheme 호출 시 상태 업데이트, 로컬스토리지 저장 및 DOM(html 태그) 클래스 수정이 정확히 전파되는지 검사합니다.
 */

describe('useTheme 테스트 하네스', () => {
  let store: Record<string, string> = {};

  // LocalStorage Mocking 하네스 정의
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
      writable: true,
    });
  });

  // 각 테스트 실행 전 상태 및 DOM 클래스 초기화
  beforeEach(() => {
    store = {};
    document.documentElement.className = '';
    
    // 기본적으로 prefers-color-scheme: dark -> false 모킹
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  test('1. 저장된 테마가 없을 때, 기본 시스템 테마가 Light이면 Light 테마로 설정된다', async () => {
    const { result } = renderHook(() => useTheme());

    // 비동기 마운트 및 훅 내부의 setTimeout 초기화 대기
    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('gravity-free')).toBe(false);
  });

  test('2. 저장된 테마가 없고 시스템 테마가 Dark이면 Dark 테마로 기본 설정된다', async () => {
    // prefers-color-scheme: dark -> true로 모킹 재정의
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('3. 로컬스토리지에 테마가 저장되어 있으면 저장된 테마를 불러온다', async () => {
    store['theme'] = 'dark';

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('4. 테마를 변경하면 로컬스토리지와 DOM 클래스가 적절히 갱신된다', async () => {
    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Dark 테마로 변경 시도
    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(store['theme']).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Light 테마로 재변경 시도
    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(store['theme']).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
