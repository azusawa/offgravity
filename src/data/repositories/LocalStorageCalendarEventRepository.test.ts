import { LocalStorageCalendarEventRepository } from './LocalStorageCalendarEventRepository';
import { CalendarEvent } from '@/domain/entities/CalendarEvent';

/**
 * Life OS Dashboard - LocalStorageCalendarEventRepository 단위 테스트 하네스
 * 
 * [검증 목적]
 * 1. 로컬스토리지 초기 상태에서 조회 시 빈 목록이 반환되는지 확인합니다.
 * 2. 신규 일정 저장 시 로컬스토리지에 올바른 JSON DTO 규격으로 데이터가 직렬화되는지 검사합니다.
 * 3. 데드라인 완료 상태 여부를 토글했을 때 정상 반영 및 영속화가 유지되는지 확인합니다.
 * 4. 일정 제거 호출 시 로컬스토리지 내 대상 객체만 선택적으로 제거되는지 확인합니다.
 * 5. 도메인 제약조건: 날짜 및 시간 형식이 불일치하거나, 이벤트 유형에서 토글 완료를 시도할 시 예외가 발생하는지 확인합니다.
 * 6. 신규 도메인 제약조건: 종료일/시간이 시작일/시간보다 앞설 경우 예외가 발생하는지 검증하고, 기간 일정이 정상 저장되는지 확인합니다.
 */

describe('LocalStorageCalendarEventRepository 테스트 하네스', () => {
  let repository: LocalStorageCalendarEventRepository;
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
    repository = new LocalStorageCalendarEventRepository();
  });

  test('1. 로컬스토리지가 비어 있으면 getEvents()는 빈 배열을 반환한다', async () => {
    const events = await repository.getEvents();
    expect(events).toEqual([]);
  });

  test('2. 신규 일정을 저장하면 로컬스토리지에 추가되고 조회 시 복원된다', async () => {
    const event = new CalendarEvent({
      id: 'event-1',
      title: '추첨 발표',
      date: '2026-07-03',
      time: '18:00',
      type: 'event',
      category: 'work'
    });

    await repository.saveEvent(event);

    expect(store['life-os-calendar-events']).toBeDefined();
    const rawData = JSON.parse(store['life-os-calendar-events']);
    expect(rawData.length).toBe(1);
    expect(rawData[0].title).toBe('추첨 발표');

    const events = await repository.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('추첨 발표');
    expect(events[0].time).toBe('18:00');
  });

  test('3. 데드라인 일정을 저장하고 완료 상태를 토글할 수 있다', async () => {
    const deadline = new CalendarEvent({
      id: 'deadline-1',
      title: '기획서 제출',
      date: '2026-07-05',
      type: 'deadline',
      isCompleted: false,
      category: 'work'
    });

    await repository.saveEvent(deadline);
    await repository.toggleEventCompletion('deadline-1');

    const events = await repository.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].isCompleted).toBe(true);
  });

  test('4. 특정 일정을 제거(delete)할 수 있다', async () => {
    const event1 = new CalendarEvent({
      id: 'event-1',
      title: '추첨 발표',
      date: '2026-07-03',
      type: 'event',
      category: 'work'
    });

    const event2 = new CalendarEvent({
      id: 'event-2',
      title: '가족 저녁 식사',
      date: '2026-07-04',
      type: 'event',
      category: 'life'
    });

    await repository.saveEvent(event1);
    await repository.saveEvent(event2);
    await repository.deleteEvent('event-1');

    const events = await repository.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('event-2');
  });

  test('5. 도메인 제약조건: 날짜 포맷이 YYYY-MM-DD가 아니면 에러가 발생한다', () => {
    expect(() => {
      new CalendarEvent({
        id: 'err-1',
        title: '날짜 오류',
        date: '2026/07/03',
        type: 'event',
        category: 'work'
      });
    }).toThrow('날짜는 YYYY-MM-DD 포맷을 준수해야 합니다.');
  });

  test('6. 도메인 제약조건: 시간 포맷이 HH:mm이 아니거나 시/분 범위를 벗어나면 에러가 발생한다', () => {
    expect(() => {
      new CalendarEvent({
        id: 'err-2',
        title: '시간 오류',
        date: '2026-07-03',
        time: '18:000',
        type: 'event',
        category: 'work'
      });
    }).toThrow('시간 정보는 HH:mm 포맷을 준수해야 합니다.');

    expect(() => {
      new CalendarEvent({
        id: 'err-3',
        title: '시분 범위 오류',
        date: '2026-07-03',
        time: '25:00',
        type: 'event',
        category: 'work'
      });
    }).toThrow('올바르지 않은 시/분 범위가 입력되었습니다.');
  });

  test('7. 도메인 제약조건: 이벤트 유형에선 완료(completion) 토글 시 에러가 발생한다', () => {
    const event = new CalendarEvent({
      id: 'event-1',
      title: '추첨 발표',
      date: '2026-07-03',
      type: 'event',
      category: 'work'
    });

    expect(() => {
      event.toggleCompletion();
    }).toThrow('이벤트 유형의 일정은 완료 여부를 제어할 수 없습니다.');
  });

  test('8. 도메인 제약조건: 종료일이 시작일보다 빠르면 에러가 발생한다', () => {
    expect(() => {
      new CalendarEvent({
        id: 'err-range-1',
        title: '종료일 선후 오류',
        date: '2026-07-03',
        endDate: '2026-07-02',
        type: 'event',
        category: 'work'
      });
    }).toThrow('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
  });

  test('9. 도메인 제약조건: 날짜는 같으나 종료시간이 시작시간보다 빠르면 에러가 발생한다', () => {
    expect(() => {
      new CalendarEvent({
        id: 'err-range-2',
        title: '종료시간 선후 오류',
        date: '2026-07-03',
        time: '18:00',
        endDate: '2026-07-03',
        endTime: '17:00',
        type: 'event',
        category: 'work'
      });
    }).toThrow('종료 시간은 시작 시간보다 빠를 수 없습니다.');
  });

  test('10. 기간 일정을 저장하면 시작일, 종료일, 시간 정보가 모두 보존 및 복원된다', async () => {
    const rangeEvent = new CalendarEvent({
      id: 'event-range-1',
      title: '워크숍',
      date: '2026-07-03',
      time: '09:00',
      endDate: '2026-07-05',
      endTime: '18:00',
      type: 'event',
      category: 'work'
    });

    await repository.saveEvent(rangeEvent);

    const events = await repository.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('워크숍');
    expect(events[0].date).toBe('2026-07-03');
    expect(events[0].endDate).toBe('2026-07-05');
    expect(events[0].time).toBe('09:00');
    expect(events[0].endTime).toBe('18:00');
  });

  test('11. 도메인 제약조건: update() 시 종료일이 시작일보다 빠르게 변경되면 에러가 발생한다', () => {
    const event = new CalendarEvent({
      id: 'event-1',
      title: '워크숍',
      date: '2026-07-03',
      type: 'event',
      category: 'work'
    });

    expect(() => {
      event.update({ endDate: '2026-07-02' });
    }).toThrow('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
  });

  test('12. repository에 일정을 수정(update)하여 다시 저장하면 정보가 업데이트된다', async () => {
    const event = new CalendarEvent({
      id: 'event-1',
      title: '기존 일정 명칭',
      date: '2026-07-03',
      type: 'event',
      category: 'work'
    });

    await repository.saveEvent(event);

    const updated = event.update({ title: '수정된 일정 명칭', category: 'life' });
    await repository.saveEvent(updated);

    const events = await repository.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('수정된 일정 명칭');
    expect(events[0].category).toBe('life');
  });
});

