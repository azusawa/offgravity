import { ProjectTask } from './ProjectTask';

/**
 * Life OS Dashboard - ProjectTask 도메인 엔티티 단위 테스트
 */
describe('ProjectTask 도메인 비즈니스 규칙 테스트', () => {
  
  test('1. 필수 값 누락 및 유효하지 않은 날짜 범위 생성자 가드 검증', () => {
    // 제목 빈 값 검사
    expect(() => {
      new ProjectTask({
        id: 't-1',
        title: '   ',
        startDate: '2026-06-27',
        endDate: '2026-06-28',
      });
    }).toThrow('작업의 제목은 빈 칸일 수 없습니다.');

    // 날짜 역전 검사
    expect(() => {
      new ProjectTask({
        id: 't-2',
        title: 'DB 설계',
        startDate: '2026-06-30',
        endDate: '2026-06-27', // 역전
      });
    }).toThrow('시작일은 종료일보다 늦을 수 없습니다.');
  });

  test('2. 상태(Status) 변경 시 진척도(Progress) 연동 검증', () => {
    const task = new ProjectTask({
      id: 't-3',
      title: 'UI 설계',
      status: 'todo',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
      progress: 30, // in_progress로 자동 조율됨
    });

    expect(task.status).toBe('in_progress');

    // 완료(done) 전환 시 progress 100% 검증
    task.updateStatus('done');
    expect(task.progress).toBe(100);

    // 미완료(todo) 전환 시 progress 0% 검증
    task.updateStatus('todo');
    expect(task.progress).toBe(0);
  });

  test('3. 진척도(Progress) 변경 시 상태(Status) 연동 검증', () => {
    const task = new ProjectTask({
      id: 't-4',
      title: '테스트 코드 작성',
      status: 'todo',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });

    expect(task.status).toBe('todo');

    // 40%로 올릴 시 in_progress 상태 검증
    task.updateProgress(40);
    expect(task.status).toBe('in_progress');

    // 100%로 올릴 시 done 상태 검증
    task.updateProgress(100);
    expect(task.status).toBe('done');
  });

  test('4. 날짜 변경 가드 검증', () => {
    const task = new ProjectTask({
      id: 't-5',
      title: '빌드 확인',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });

    expect(() => {
      task.updateDates('2026-06-29', '2026-06-28');
    }).toThrow('시작일은 종료일보다 늦을 수 없습니다.');
  });

  test('5. 그룹 노드(Group) 생성 및 자식 연계 집계 검증', () => {
    // 그룹 노드 생성
    const groupTask = new ProjectTask({
      id: 'g-1',
      title: '게시판 구현',
      type: 'group',
      startDate: '2026-06-27',
      endDate: '2026-06-28',
    });

    expect(groupTask.type).toBe('group');
    expect(groupTask.parentId).toBeNull();

    // 자식 태스크 1
    const child1 = new ProjectTask({
      id: 't-6',
      title: '내용 생성',
      startDate: '2026-06-27',
      endDate: '2026-06-29',
      progress: 100, // done 상태 자동 전환
      parentId: 'g-1',
    });

    // 자식 태스크 2
    const child2 = new ProjectTask({
      id: 't-7',
      title: '내용 삭제',
      startDate: '2026-06-28',
      endDate: '2026-07-02',
      progress: 0, // todo 상태
      parentId: 'g-1',
    });

    // 집계 실행
    groupTask.aggregateFromChildren([child1, child2]);

    // 시작일은 자식 중 최소인 2026-06-27, 마감일은 최대인 2026-07-02로 연장되어야 함
    expect(groupTask.startDate).toBe('2026-06-27');
    expect(groupTask.endDate).toBe('2026-07-02');

    // 진척도는 (100 + 0) / 2 = 50%
    expect(groupTask.progress).toBe(50);

    // 상태는 자식들의 상태가 done, todo가 섞여있으므로 in_progress
    expect(groupTask.status).toBe('in_progress');

    // 자식2도 마저 완료 상태로 수정
    child2.updateProgress(100);
    groupTask.aggregateFromChildren([child1, child2]);

    // 모든 자식이 done이므로 그룹 상태도 done, 진척도 100%
    expect(groupTask.progress).toBe(100);
    expect(groupTask.status).toBe('done');
  });
});
