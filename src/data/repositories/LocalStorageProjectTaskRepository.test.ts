import { LocalStorageProjectTaskRepository } from './LocalStorageProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';

/**
 * Life OS Dashboard - LocalStorageProjectTaskRepository 단위 테스트
 */
describe('LocalStorageProjectTaskRepository 테스트 하네스', () => {
  let repository: LocalStorageProjectTaskRepository;
  let store: Record<string, string> = {};

  beforeAll(() => {
    // LocalStorage Mocking
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
    repository = new LocalStorageProjectTaskRepository();
  });

  test('1. 로컬스토리지가 비어 있으면 getAll()은 빈 배열을 반환한다', async () => {
    const tasks = await repository.getAll();
    expect(tasks).toEqual([]);
  });

  test('2. 신규 태스크 저장 시 로컬스토리지에 추가되고 복원된다', async () => {
    const task = new ProjectTask({
      id: 'task-test-1',
      title: '간트 차트 구현',
      description: 'CSS Grid로 간트 바 렌더링하기',
      status: 'todo',
      startDate: '2026-06-27',
      endDate: '2026-06-30',
    });

    await repository.save(task);

    // 로컬스토리지 적재 검증
    expect(store['offgravity-project-tasks']).toBeDefined();
    const rawData = JSON.parse(store['offgravity-project-tasks']);
    expect(rawData.length).toBe(1);
    expect(rawData[0].title).toBe('간트 차트 구현');

    // 복원 검증
    const tasksFromRepo = await repository.getAll();
    expect(tasksFromRepo.length).toBe(1);
    expect(tasksFromRepo[0]).toBeInstanceOf(ProjectTask);
    expect(tasksFromRepo[0].description).toBe('CSS Grid로 간트 바 렌더링하기');
  });

  test('3. 태스크 상태 수정 후 저장 시 덮어쓰기 검증', async () => {
    const task = new ProjectTask({
      id: 'task-test-2',
      title: '칸반 보드 드래그앤드롭',
      status: 'todo',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });

    await repository.save(task);

    // 상태 변경
    task.updateStatus('in_progress');
    await repository.save(task);

    const tasksFromRepo = await repository.getAll();
    expect(tasksFromRepo[0].status).toBe('in_progress');
    expect(tasksFromRepo[0].progress).toBe(50); // 기본 보정값 50%
  });

  test('4. 태스크 삭제 검증', async () => {
    const task1 = new ProjectTask({
      id: 'task-test-3-1',
      title: '작업 A',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });
    const task2 = new ProjectTask({
      id: 'task-test-3-2',
      title: '작업 B',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });

    await repository.save(task1);
    await repository.save(task2);

    const initialTasks = await repository.getAll();
    expect(initialTasks.length).toBe(2);

    // 삭제 실행
    await repository.delete('task-test-3-1');

    const finalTasks = await repository.getAll();
    expect(finalTasks.length).toBe(1);
    expect(finalTasks[0].id).toBe('task-test-3-2');
  });
});
