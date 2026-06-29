import { ProjectTask } from '../entities/ProjectTask';
import { ProjectTaskTreeService } from './ProjectTaskTreeService';

describe('ProjectTaskTreeService 테스트', () => {
  test('1. 플랫 리스트를 트리 구조로 정상 빌드하고 그룹 속성을 자동 집계하는지 검증', () => {
    // To Do: g-1 (Group) -> t-1 (Task), t-2 (Task)
    const rawTasks = [
      new ProjectTask({
        id: 'g-1',
        title: '게시판 개발',
        type: 'group',
        startDate: '2026-06-25',
        endDate: '2026-06-26', // 초기 값
        progress: 0,
      }),
      new ProjectTask({
        id: 't-1',
        title: '글 생성 기능',
        startDate: '2026-06-27',
        endDate: '2026-06-29',
        progress: 100, // done
        parentId: 'g-1',
      }),
      new ProjectTask({
        id: 't-2',
        title: '글 수정 기능',
        startDate: '2026-06-28',
        endDate: '2026-07-02',
        progress: 50, // in_progress
        parentId: 'g-1',
      }),
    ];

    const tree = ProjectTaskTreeService.buildTree(rawTasks);

    // 루트는 g-1 단 하나여야 함
    expect(tree.length).toBe(1);
    const root = tree[0];
    expect(root.id).toBe('g-1');
    expect(root.children?.length).toBe(2);

    // 날짜 자동 집계 검증: 최소시작 06-27, 최대종료 07-02
    expect(root.startDate).toBe('2026-06-27');
    expect(root.endDate).toBe('2026-07-02');

    // 진척도 집계 검증: (100 + 50) / 2 = 75
    expect(root.progress).toBe(75);

    // 상태 검증: done과 in_progress가 섞였으므로 in_progress
    expect(root.status).toBe('in_progress');
  });

  test('2. 트리 리스트를 계층 순서(Pre-order)로 1차원 플랫 리스트로 펼치는지 검증', () => {
    const rawTasks = [
      new ProjectTask({ id: 'g-1', title: '그룹 1', type: 'group', startDate: '2026-06-25', endDate: '2026-06-26' }),
      new ProjectTask({ id: 't-1', title: '작업 1-1', startDate: '2026-06-25', endDate: '2026-06-26', parentId: 'g-1' }),
      new ProjectTask({ id: 'g-2', title: '그룹 2 (서브)', type: 'group', startDate: '2026-06-25', endDate: '2026-06-26', parentId: 'g-1' }),
      new ProjectTask({ id: 't-2', title: '작업 1-2-1', startDate: '2026-06-25', endDate: '2026-06-26', parentId: 'g-2' }),
      new ProjectTask({ id: 't-3', title: '독립 작업', startDate: '2026-06-25', endDate: '2026-06-26' }),
    ];

    const tree = ProjectTaskTreeService.buildTree(rawTasks);
    const flat = ProjectTaskTreeService.flattenTree(tree);

    // 계층 순서: g-1 -> [t-1, g-2 -> [t-2]] -> t-3
    expect(flat.length).toBe(5);
    expect(flat[0].id).toBe('g-1');
    expect(flat[1].id).toBe('t-1');
    expect(flat[2].id).toBe('g-2');
    expect(flat[3].id).toBe('t-2');
    expect(flat[4].id).toBe('t-3');
  });
});
