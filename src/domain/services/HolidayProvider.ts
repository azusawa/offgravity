/**
 * Life OS Dashboard - HolidayProvider 서비스
 * 
 * [설명]
 * 1. 2025년 ~ 2027년 대한민국(KR), 일본(JP), 미국(US)의 법정 공휴일 정적 테이블 데이터를 제공합니다.
 * 2. 네트워크 상태와 무관하게 로컬에서 즉시 계산 및 조회 가능하도록 설계되었습니다.
 * 3. 각국의 공휴일 명칭은 완전하게 해당 국가의 공식 언어(KR: 한국어, JP: 일본어, US: 영어)로만 표출됩니다.
 */

export interface HolidayInfo {
  date: string;    // YYYY-MM-DD
  name: string;    // 공휴일 명칭
  country: 'KR' | 'JP' | 'US';
}

// 2025~2027년 주요 법정 공휴일 데이터베이스 (정적 맵)
const HOLIDAY_DATABASE: Record<string, Omit<HolidayInfo, 'date'>[]> = {
  // --- 2025년 ---
  '2025-01-01': [{ name: '신정', country: 'KR' }, { name: '元日', country: 'JP' }, { name: "New Year's Day", country: 'US' }],
  '2025-01-13': [{ name: '成人の日', country: 'JP' }],
  '2025-01-20': [{ name: 'Martin Luther King Jr. Day', country: 'US' }],
  '2025-01-28': [{ name: '설날연휴', country: 'KR' }],
  '2025-01-29': [{ name: '설날', country: 'KR' }],
  '2025-01-30': [{ name: '설날연휴', country: 'KR' }],
  '2025-02-11': [{ name: '建国記念の日', country: 'JP' }],
  '2025-02-17': [{ name: "Presidents' Day", country: 'US' }],
  '2025-02-23': [{ name: '天皇誕生日', country: 'JP' }],
  '2025-02-24': [{ name: '振替休日', country: 'JP' }],
  '2025-03-01': [{ name: '삼일절', country: 'KR' }],
  '2025-03-03': [{ name: '대체공휴일', country: 'KR' }],
  '2025-03-20': [{ name: '春分の日', country: 'JP' }],
  '2025-04-29': [{ name: '昭和の日', country: 'JP' }],
  '2025-05-03': [{ name: '憲法記念日', country: 'JP' }],
  '2025-05-04': [{ name: 'みどりの日', country: 'JP' }],
  '2025-05-05': [{ name: '어린이날', country: 'KR' }, { name: 'こどもの日', country: 'JP' }],
  '2025-05-06': [{ name: '대체공휴일', country: 'KR' }, { name: '振替休日', country: 'JP' }],
  '2025-05-26': [{ name: 'Memorial Day', country: 'US' }],
  '2025-06-06': [{ name: '현충일', country: 'KR' }],
  '2025-06-19': [{ name: 'Juneteenth', country: 'US' }],
  '2025-07-04': [{ name: 'Independence Day', country: 'US' }],
  '2025-07-21': [{ name: '海の日', country: 'JP' }],
  '2025-08-11': [{ name: '山の日', country: 'JP' }],
  '2025-08-15': [{ name: '광복절', country: 'KR' }],
  '2025-09-01': [{ name: 'Labor Day', country: 'US' }],
  '2025-09-15': [{ name: '敬老の日', country: 'JP' }],
  '2025-09-23': [{ name: '秋分の日', country: 'JP' }],
  '2025-10-03': [{ name: '개천절', country: 'KR' }],
  '2025-10-05': [{ name: '추석연휴', country: 'KR' }],
  '2025-10-06': [{ name: '추석', country: 'KR' }],
  '2025-10-07': [{ name: '추석연휴', country: 'KR' }],
  '2025-10-08': [{ name: '대체공휴일', country: 'KR' }],
  '2025-10-09': [{ name: '한글날', country: 'KR' }],
  '2025-10-13': [{ name: '体育の日', country: 'JP' }, { name: 'Columbus Day', country: 'US' }],
  '2025-11-03': [{ name: '文化の日', country: 'JP' }],
  '2025-11-11': [{ name: 'Veterans Day', country: 'US' }],
  '2025-11-23': [{ name: '勤労感謝の日', country: 'JP' }],
  '2025-11-24': [{ name: '振替休日', country: 'JP' }],
  '2025-11-27': [{ name: 'Thanksgiving', country: 'US' }],
  '2025-12-25': [{ name: '성탄절', country: 'KR' }, { name: 'Christmas Day', country: 'US' }],

  // --- 2026년 ---
  '2026-01-01': [{ name: '신정', country: 'KR' }, { name: '元日', country: 'JP' }, { name: "New Year's Day", country: 'US' }],
  '2026-01-12': [{ name: '成人の日', country: 'JP' }],
  '2026-01-19': [{ name: 'Martin Luther King Jr. Day', country: 'US' }],
  '2026-02-11': [{ name: '建国記念の日', country: 'JP' }],
  '2026-02-16': [{ name: '설날연휴', country: 'KR' }],
  '2026-02-17': [{ name: '설날', country: 'KR' }],
  '2026-02-18': [{ name: '설날연휴', country: 'KR' }],
  '2026-02-23': [{ name: '天皇誕生日', country: 'JP' }],
  '2026-03-01': [{ name: '삼일절', country: 'KR' }],
  '2026-03-02': [{ name: '대체공휴일', country: 'KR' }],
  '2026-03-20': [{ name: '春分の日', country: 'JP' }],
  '2026-04-29': [{ name: '昭和の日', country: 'JP' }],
  '2026-05-03': [{ name: '憲法記念日', country: 'JP' }],
  '2026-05-04': [{ name: 'みどりの日', country: 'JP' }],
  '2026-05-05': [{ name: '어린이날', country: 'KR' }, { name: 'こどもの日', country: 'JP' }],
  '2026-05-06': [{ name: '振替休日', country: 'JP' }],
  '2026-05-24': [{ name: '석가탄신일', country: 'KR' }],
  '2026-05-25': [{ name: '대체공휴일', country: 'KR' }, { name: 'Memorial Day', country: 'US' }],
  '2026-06-06': [{ name: '현충일', country: 'KR' }],
  '2026-06-19': [{ name: 'Juneteenth', country: 'US' }],
  '2026-07-04': [{ name: 'Independence Day', country: 'US' }],
  '2026-07-20': [{ name: '海の日', country: 'JP' }],
  '2026-08-11': [{ name: '山の日', country: 'JP' }],
  '2026-08-15': [{ name: '광복절', country: 'KR' }],
  '2026-09-07': [{ name: 'Labor Day', country: 'US' }],
  '2026-09-21': [{ name: '敬老の日', country: 'JP' }],
  '2026-09-22': [{ name: '秋分の日', country: 'JP' }],
  '2026-09-24': [{ name: '추석연휴', country: 'KR' }],
  '2026-09-25': [{ name: '추석', country: 'KR' }],
  '2026-09-26': [{ name: '추석연휴', country: 'KR' }],
  '2026-09-28': [{ name: '대체공휴일', country: 'KR' }],
  '2026-10-03': [{ name: '개천절', country: 'KR' }],
  '2026-10-05': [{ name: '대체공휴일', country: 'KR' }],
  '2026-10-09': [{ name: '한글날', country: 'KR' }],
  '2026-10-12': [{ name: '体育の日', country: 'JP' }, { name: 'Columbus Day', country: 'US' }],
  '2026-11-03': [{ name: '文化の日', country: 'JP' }],
  '2026-11-11': [{ name: 'Veterans Day', country: 'US' }],
  '2026-11-23': [{ name: '勤労感謝の日', country: 'JP' }],
  '2026-11-26': [{ name: 'Thanksgiving', country: 'US' }],
  '2026-12-25': [{ name: '성탄절', country: 'KR' }, { name: 'Christmas Day', country: 'US' }],

  // --- 2027년 ---
  '2027-01-01': [{ name: '신정', country: 'KR' }, { name: '元日', country: 'JP' }, { name: "New Year's Day", country: 'US' }],
  '2027-01-11': [{ name: '成人の日', country: 'JP' }],
  '2027-01-18': [{ name: 'Martin Luther King Jr. Day', country: 'US' }],
  '2027-02-06': [{ name: '설날연휴', country: 'KR' }],
  '2027-02-07': [{ name: '설날', country: 'KR' }],
  '2027-02-08': [{ name: '설날연휴', country: 'KR' }],
  '2027-02-09': [{ name: '대체공휴일', country: 'KR' }],
  '2027-02-11': [{ name: '建国記念の日', country: 'JP' }],
  '2027-02-15': [{ name: "Presidents' Day", country: 'US' }],
  '2027-02-23': [{ name: '天皇誕生日', country: 'JP' }],
  '2027-03-01': [{ name: '삼일절', country: 'KR' }],
  '2027-03-21': [{ name: '春分の日', country: 'JP' }],
  '2027-03-22': [{ name: '振替休日', country: 'JP' }],
  '2027-04-29': [{ name: '昭和の日', country: 'JP' }],
  '2027-05-03': [{ name: '憲法記念日', country: 'JP' }],
  '2027-05-04': [{ name: 'みどりの日', country: 'JP' }],
  '2027-05-05': [{ name: '어린이날', country: 'KR' }, { name: 'こどもの日', country: 'JP' }],
  '2027-05-13': [{ name: '석가탄신일', country: 'KR' }],
  '2027-05-31': [{ name: 'Memorial Day', country: 'US' }],
  '2027-06-06': [{ name: '현충일', country: 'KR' }],
  '2027-06-19': [{ name: 'Juneteenth', country: 'US' }],
  '2027-07-04': [{ name: 'Independence Day', country: 'US' }],
  '2027-07-05': [{ name: 'Independence Day (Observed)', country: 'US' }],
  '2027-07-19': [{ name: '海の日', country: 'JP' }],
  '2027-08-11': [{ name: '山の日', country: 'JP' }],
  '2027-08-15': [{ name: '광복절', country: 'KR' }],
  '2027-08-16': [{ name: '대체공휴일', country: 'KR' }],
  '2027-09-06': [{ name: 'Labor Day', country: 'US' }],
  '2027-09-14': [{ name: '추석연휴', country: 'KR' }],
  '2027-09-15': [{ name: '추석', country: 'KR' }],
  '2027-09-16': [{ name: '추석연휴', country: 'KR' }],
  '2027-09-20': [{ name: '敬老の日', country: 'JP' }],
  '2027-09-23': [{ name: '秋分の日', country: 'JP' }],
  '2027-10-03': [{ name: '개천절', country: 'KR' }],
  '2027-10-04': [{ name: '대체공휴일', country: 'KR' }],
  '2027-10-09': [{ name: '한글날', country: 'KR' }],
  '2027-10-11': [{ name: '体育の日', country: 'JP' }, { name: 'Columbus Day', country: 'US' }],
  '2027-11-03': [{ name: '文化の日', country: 'JP' }],
  '2027-11-11': [{ name: 'Veterans Day', country: 'US' }],
  '2027-11-23': [{ name: '勤労感謝の日', country: 'JP' }],
  '2027-11-25': [{ name: 'Thanksgiving', country: 'US' }],
  '2027-12-25': [{ name: '성탄절', country: 'KR' }, { name: 'Christmas Day', country: 'US' }],
};

export class HolidayProvider {
  /**
   * 지정한 연도/월 및 국가 코드 리스트에 부합하는 법정 공휴일 목록을 추출하여 리턴합니다.
   */
  public static getHolidays(
    year: number,
    month: number,
    countries: ('KR' | 'JP' | 'US')[]
  ): HolidayInfo[] {
    const list: HolidayInfo[] = [];
    const monthStr = String(month + 1).padStart(2, '0');
    const prefix = `${year}-${monthStr}-`;

    Object.keys(HOLIDAY_DATABASE).forEach((dateKey) => {
      if (dateKey.startsWith(prefix)) {
        const infos = HOLIDAY_DATABASE[dateKey];
        infos.forEach((info) => {
          if (countries.includes(info.country)) {
            list.push({
              date: dateKey,
              name: info.name,
              country: info.country
            });
          }
        });
      }
    });

    return list;
  }
}
