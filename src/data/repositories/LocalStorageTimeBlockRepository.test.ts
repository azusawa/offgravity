import { LocalStorageTimeBlockRepository } from './LocalStorageTimeBlockRepository';
import { TimeBlock } from '@/domain/entities/TimeBlock';

/**
 * Life OS Dashboard - LocalStorageTimeBlockRepository 단위 테스트 하네스
 * 
 * [검증 목적]
 * 1. 로컬스토리지 초기 상태에서 조회 시 빈 목록이 반환되는지 확인합니다.
 * 2. 신규 타임블록 저장 시 로컬스토리지에 올바른 JSON 규격(DTO)으로 데이터가 직렬화되는지 검사합니다.
 * 3. 기존 일정 수정 시 데이터 덮어쓰기가 안정적으로 반영되는지 확인합니다.
 * 4. 일정 제거 호출 시 로컬스토리지 내 대상 객체만 선택 차단 및 제거되는지 확인합니다.
 * 5. 시작 시간이 종료 시간보다 늦거나 같은 잘못된 입력값 등록 시 도메인 예외가 정상 유발되는지 확인합니다.
 */

describe('LocalStorageTimeBlockRepository 테스트 하네스', () => {
  let repository: LocalStorageTimeBlockRepository;
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

  beforeEach(() => {
    store = {};
    repository = new LocalStorageTimeBlockRepository();
  });

  test('1. 로컬스토리지가 비어 있으면 getTimeBlocks()는 빈 배열을 반환한다', async () => {
    const blocks = await repository.getTimeBlocks();
    expect(blocks).toEqual([]);
  });

  test('2. 신규 일정을 저장하면 로컬스토리지에 추가되고 조회 시 복원된다', async () => {
    const block = new TimeBlock({
      id: 'block-1',
      title: '아침 요가',
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 30,
      category: 'health'
    });

    await repository.saveTimeBlock(block);

    expect(store['life-os-time-blocks']).toBeDefined();
    const rawData = JSON.parse(store['life-os-time-blocks']);
    expect(rawData.length).toBe(1);
    expect(rawData[0].title).toBe('아침 요가');

    const blocks = await repository.getTimeBlocks();
    expect(blocks.length).toBe(1);
    expect(blocks[0].title).toBe('아침 요가');
    expect(blocks[0].durationMinutes).toBe(90);
  });

  test('3. 기존 일정의 정보를 업데이트하여 덮어쓸 수 있다', async () => {
    const block1 = new TimeBlock({
      id: 'block-1',
      title: '아침 요가',
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 30,
      category: 'health'
    });

    await repository.saveTimeBlock(block1);

    const blockUpdated = new TimeBlock({
      id: 'block-1',
      title: '아침 필라테스',
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 45,
      category: 'health'
    });

    await repository.saveTimeBlock(blockUpdated);

    const blocks = await repository.getTimeBlocks();
    expect(blocks.length).toBe(1);
    expect(blocks[0].title).toBe('아침 필라테스');
    expect(blocks[0].durationMinutes).toBe(105);
  });

  test('4. 특정 일정을 제거(delete)할 수 있다', async () => {
    const block1 = new TimeBlock({
      id: 'block-1',
      title: '아침 요가',
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 30,
      category: 'health'
    });

    const block2 = new TimeBlock({
      id: 'block-2',
      title: '코딩 학습',
      startHour: 10,
      startMinute: 0,
      endHour: 12,
      endMinute: 0,
      category: 'work'
    });

    await repository.saveTimeBlock(block1);
    await repository.saveTimeBlock(block2);

    await repository.deleteTimeBlock('block-1');

    const blocks = await repository.getTimeBlocks();
    expect(blocks.length).toBe(1);
    expect(blocks[0].id).toBe('block-2');
  });

  test('5. 도메인 제약조건: 시작 시간이 종료 시간보다 늦거나 같으면 객체 생성에 실패한다', () => {
    expect(() => {
      new TimeBlock({
        id: 'block-err',
        title: '잘못된 일정',
        startHour: 14,
        startMinute: 0,
        endHour: 13,
        endMinute: 0,
        category: 'work'
      });
    }).toThrow('시작 시간이 종료 시간보다 같거나 늦을 수 없습니다.');
  });
});
