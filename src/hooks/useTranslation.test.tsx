import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { useTranslation, TranslationProvider } from './useTranslation';

/**
 * Life OS Dashboard - useTranslation 다국어 훅 단위 테스트
 * 
 * [검증 목적]
 * 1. 로컬스토리지에 설정값이 없을 때 기본 언어가 'ko'로 복원되는지 검증합니다.
 * 2. 로컬스토리지에 기저장된 로케일이 존재할 시 마운트 시점에 알맞은 언어로 복원되는지 검증합니다.
 * 3. changeLocale을 통해 언어 상태를 변환하고 로컬스토리지에 영속화되는지 확인합니다.
 * 4. t(keyPath) 번역 조회가 정상 수행되는지 검증합니다.
 * 5. 템플릿 매개변수 치환 기능(예: {count})이 정상 동작하는지 검증합니다.
 * 6. 사전에 등록되지 않은 잘못된 키 요청 시 키 문자열이 그대로 반환되는지 확인합니다.
 */

describe('useTranslation 테스트 하네스', () => {
  let store: Record<string, string> = {};

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

  beforeEach(() => {
    store = {};
  });

  // TranslationProvider 전역 컨텍스트를 주입하여 훅 렌더링을 돕는 헬퍼 함수
  const renderTranslationHook = () => renderHook(() => useTranslation(), { 
    wrapper: ({ children }) => <TranslationProvider>{children}</TranslationProvider>
  });

  test('1. 저장된 로케일이 없을 때 기본 로케일은 ko이다', async () => {
    const { result } = renderTranslationHook();

    // useEffect 안의 setTimeout 0ms 대기
    await waitFor(() => {
      expect(result.current.locale).toBe('ko');
    });

    expect(result.current.t('common.dashboard')).toBe('대시보드');
  });

  test('2. 로컬스토리지에 로케일이 en으로 저장되어 있으면 en으로 복원된다', async () => {
    store['life-os-locale'] = 'en';

    const { result } = renderTranslationHook();

    await waitFor(() => {
      expect(result.current.locale).toBe('en');
    });

    expect(result.current.t('common.dashboard')).toBe('Dashboard');
  });

  test('3. 로컬스토리지에 로케일이 ja로 저장되어 있으면 ja로 복원된다', async () => {
    store['life-os-locale'] = 'ja';

    const { result } = renderTranslationHook();

    await waitFor(() => {
      expect(result.current.locale).toBe('ja');
    });

    expect(result.current.t('common.dashboard')).toBe('ダッシュボード');
  });

  test('4. changeLocale 호출 시 로케일 변경 및 로컬스토리지 영속화가 이루어진다', async () => {
    const { result } = renderTranslationHook();

    await waitFor(() => {
      expect(result.current.locale).toBe('ko');
    });

    act(() => {
      result.current.changeLocale('en');
    });

    expect(result.current.locale).toBe('en');
    expect(store['life-os-locale']).toBe('en');
    expect(result.current.t('common.dashboard')).toBe('Dashboard');

    act(() => {
      result.current.changeLocale('ja');
    });

    expect(result.current.locale).toBe('ja');
    expect(store['life-os-locale']).toBe('ja');
    expect(result.current.t('common.dashboard')).toBe('ダッシュボード');
  });

  test('5. 템플릿 매개변수 치환 기능이 정상적으로 동작한다', async () => {
    const { result } = renderTranslationHook();

    await waitFor(() => {
      expect(result.current.locale).toBe('ko');
    });

    expect(result.current.t('calendar.numEvents', { count: 3 })).toBe('이벤트 3개');

    act(() => {
      result.current.changeLocale('en');
    });

    expect(result.current.t('calendar.numEvents', { count: 5 })).toBe('5 Events');

    act(() => {
      result.current.changeLocale('ja');
    });

    expect(result.current.t('calendar.numEvents', { count: 1 })).toBe('イベント 1件');
  });

  test('6. 존재하지 않는 키 경로 요청 시 키 경로 자체가 그대로 반환된다', async () => {
    const { result } = renderTranslationHook();

    await waitFor(() => {
      expect(result.current.locale).toBe('ko');
    });

    expect(result.current.t('invalid.key.path')).toBe('invalid.key.path');
    expect(result.current.t('common.nonexistent')).toBe('common.nonexistent');
  });
});
