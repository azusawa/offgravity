import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Life OS Dashboard - Vitest 설정 파일
 * 
 * [설명]
 * 단위 테스트 및 통합 테스트 하네스를 구동하기 위한 Vitest의 전역 설정입니다.
 * 1. jsdom 환경을 지정하여 브라우저 DOM API를 노드 상에서 시뮬레이션합니다.
 * 2. globals: true로 설정하여 별도 import 없이 describe, test, expect를 전역적으로 활용합니다.
 * 3. Next.js의 path alias('@/*')를 해석하기 위해 resolve.alias 설정을 추가했습니다.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
