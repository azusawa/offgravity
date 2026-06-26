import { LocalStorageTargetGoalRepository } from './LocalStorageTargetGoalRepository';
import { TargetGoal } from '@/domain/entities/TargetGoal';

/**
 * Life OS Dashboard - LocalStorageTargetGoalRepository 단위 테스트 하네스
 * 
 * [검증 목적]
 * 1. 로컬스토리지 초기 상태에서 조회 시 빈 목록이 반환되는지 확인합니다.
 * 2. 신규 목표 저장(save) 시 로컬스토리지에 올바른 JSON 규격(DTO)으로 데이터가 직렬화되는지 검사합니다.
 * 3. 기존 목표 수정(save) 시 데이터 덮어쓰기가 안정적으로 반영되는지 확인합니다.
 * 4. 목표 제거(delete) 호출 시 로컬스토리지 내 대상 객체만 선택 차단 및 제거되는지 확인합니다.
 */

describe('LocalStorageTargetGoalRepository 테스트 하네스', () => {
  let repository: LocalStorageTargetGoalRepository;
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
    repository = new LocalStorageTargetGoalRepository();
  });

  test('1. 로컬스토리지가 비어 있으면 getAll()은 빈 배열을 반환한다', async () => {
    const goals = await repository.getAll();
    expect(goals).toEqual([]);
  });

  test('2. 신규 목표를 저장하면 로컬스토리지에 추가되고 조회 시 복원된다', async () => {
    const goal = new TargetGoal({
      id: 'test-1',
      title: '책 50페이지 읽기',
      period: 'weekly',
      category: 'growth',
    });

    await repository.save(goal);

    // 로컬스토리지 문자열 확인
    expect(store['offgravity-target-goals']).toBeDefined();
    const rawData = JSON.parse(store['offgravity-target-goals']);
    expect(rawData.length).toBe(1);
    expect(rawData[0].title).toBe('책 50페이지 읽기');
    expect(rawData[0].progress).toBe(0);

    // getAll() 호출 복원 확인
    const goalsFromRepo = await repository.getAll();
    expect(goalsFromRepo.length).toBe(1);
    expect(goalsFromRepo[0]).toBeInstanceOf(TargetGoal);
    expect(goalsFromRepo[0].title).toBe('책 50페이지 읽기');
  });

  test('3. 진척도가 수정된 도메인을 저장하면 로컬스토리지 데이터가 덮어씌워진다', async () => {
    const goal = new TargetGoal({
      id: 'test-2',
      title: '헬스장 가기',
      period: 'weekly',
      category: 'health',
      progress: 20,
    });

    // 신규 추가
    await repository.save(goal);
    
    // 도메인 규칙 수정
    goal.updateProgress(80);
    
    // 덮어쓰기 저장
    await repository.save(goal);

    const goals = await repository.getAll();
    expect(goals.length).toBe(1);
    expect(goals[0].progress).toBe(80);
    expect(goals[0].isCompleted).toBe(false);

    // 100% 도달 완료 조건 자동 전환 검증
    goal.updateProgress(100);
    await repository.save(goal);

    const updatedGoals = await repository.getAll();
    expect(updatedGoals[0].isCompleted).toBe(true);
  });

  test('4. 특정 ID를 삭제하면 대상 데이터만 사라진다', async () => {
    const goal1 = new TargetGoal({
      id: 'test-id-1',
      title: '첫 번째 업무 목표',
      period: 'weekly',
      category: 'work',
    });
    const goal2 = new TargetGoal({
      id: 'test-id-2',
      title: '두 번째 일상 목표',
      period: 'weekly',
      category: 'life',
    });

    await repository.save(goal1);
    await repository.save(goal2);

    const initialGoals = await repository.getAll();
    expect(initialGoals.length).toBe(2);

    // goal1 삭제
    await repository.delete('test-id-1');

    const finalGoals = await repository.getAll();
    expect(finalGoals.length).toBe(1);
    expect(finalGoals[0].id).toBe('test-id-2');
    expect(finalGoals[0].title).toBe('두 번째 일상 목표');
  });

  test('5. 하위 할 일(ToDo)을 추가하면 완료 상태에 따라 진척도가 자동 갱신 및 보존된다', async () => {
    const goal = new TargetGoal({
      id: 'test-todo-1',
      title: '하위 할 일 연동 테스트',
      period: 'weekly',
      category: 'work',
    });

    await repository.save(goal);

    // 1) 할 일 추가
    goal.addTodo({
      id: 'todo-sub-1',
      title: '첫 번째 태스크',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
    goal.addTodo({
      id: 'todo-sub-2',
      title: '두 번째 태스크',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    await repository.save(goal);

    // 로컬스토리지 저장 여부 검증
    const rawData = JSON.parse(store['offgravity-target-goals']);
    expect(rawData[0].todos.length).toBe(2);
    expect(rawData[0].progress).toBe(0); // 0/2 완료이므로 0%

    // 2) 할 일 토글
    goal.toggleTodo('todo-sub-1');
    expect(goal.progress).toBe(50); // 1/2 완료이므로 50%
    await repository.save(goal);

    const goalsFromRepo = await repository.getAll();
    expect(goalsFromRepo[0].progress).toBe(50);
    expect(goalsFromRepo[0].todos.length).toBe(2);
    expect(goalsFromRepo[0].todos[0].isCompleted).toBe(true);

    // 3) 할 일 삭제
    goal.removeTodo('todo-sub-2');
    expect(goal.progress).toBe(100); // 1/1 완료이므로 100%
    expect(goal.isCompleted).toBe(true);
    await repository.save(goal);

    const finalGoalsFromRepo = await repository.getAll();
    expect(finalGoalsFromRepo[0].progress).toBe(100);
    expect(finalGoalsFromRepo[0].isCompleted).toBe(true);
    expect(finalGoalsFromRepo[0].todos.length).toBe(1);
  });
});
