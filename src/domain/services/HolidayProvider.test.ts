import { HolidayProvider } from './HolidayProvider';

/**
 * Life OS Dashboard - HolidayProvider 단위 테스트 하네스
 * 
 * [검증 목적]
 * 1. 활성화 국가가 없으면 공휴일 조회가 빈 배열로 나오는지 확인합니다.
 * 2. 2026년 10월 한국(KR) 공휴일 조회 시 개천절, 한글날, 대체공휴일이 정상 도출되는지 확인합니다.
 * 3. 2026년 11월 미국(US) 공휴일 조회 시 유동 공휴일인 추수감사절(11/26)이 정상 도출되는지 확인합니다.
 * 4. 2026년 1월 일본(JP) 공휴일 조회 시 성인의 날(1/12) 등 해피 먼데이 일정이 매핑되는지 확인합니다.
 */

describe('HolidayProvider 테스트 하네스', () => {
  test('1. 활성화 국가 목록이 비어 있으면 빈 공휴일 배열을 반환한다', () => {
    const list = HolidayProvider.getHolidays(2026, 9, []); // 10월
    expect(list).toEqual([]);
  });

  test('2. 2026년 10월 대한민국(KR) 공휴일을 조회하면 개천절, 한글날, 대체공휴일 등이 도출된다', () => {
    const list = HolidayProvider.getHolidays(2026, 9, ['KR']); // 10월

    const names = list.map((h) => h.name);
    expect(names).toContain('개천절');
    expect(names).toContain('한글날');
    expect(names).toContain('대체공휴일'); // 2026-10-05

    const gaecheonjeol = list.find((h) => h.name === '개천절');
    expect(gaecheonjeol?.date).toBe('2026-10-03');
  });

  test('3. 2026년 11월 미국(US) 공휴일을 조회하면 추수감사절(11/26)이 정상 조회된다', () => {
    const list = HolidayProvider.getHolidays(2026, 10, ['US']); // 11월

    const thanksgiving = list.find((h) => h.name === 'Thanksgiving');
    expect(thanksgiving).toBeDefined();
    expect(thanksgiving?.date).toBe('2026-11-26');
  });

  test('4. 2026년 1월 일본(JP) 공휴일을 조회하면 성인의 날(1/12)이 정상 조회된다', () => {
    const list = HolidayProvider.getHolidays(2026, 0, ['JP']); // 1월

    const comingOfAge = list.find((h) => h.name === '成人の日');
    expect(comingOfAge).toBeDefined();
    expect(comingOfAge?.date).toBe('2026-01-12');
  });
});
