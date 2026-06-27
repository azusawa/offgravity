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
});
