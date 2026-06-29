import { ProjectTask } from '../entities/ProjectTask';

/**
 * Life OS Dashboard - ProjectTaskTreeService
 * 
 * [설명]
 * 평평한 ProjectTask 리스트를 계층 트리 구조로 변환하여 상향식 집계 연산을 수행하고,
 * 다시 UI 그리드 렌더링에 적합한 깊이 우선 순서로 정렬된 플랫 리스트로 복원하는 도메인 서비스입니다.
 */
export class ProjectTaskTreeService {
  /**
   * 플랫 리스트를 트리 구조로 재구조화하고 그룹의 날짜/진척도/상태를 집계합니다.
   * 후위 순회(Post-order)를 통해 자식들의 계산이 완료된 후 부모 노드가 집계되도록 보장합니다.
   */
  public static buildTree(tasks: ProjectTask[]): ProjectTask[] {
    if (tasks.length === 0) return [];

    // 1. 엔티티 인스턴스 복제 및 맵 작성
    const taskMap = new Map<string, ProjectTask>();
    const clonedTasks = tasks.map(t => {
      const clone = t.clone();
      clone.children = []; // 트리 빌드를 위해 자식 리스트 초기화
      taskMap.set(clone.id, clone);
      return clone;
    });

    // 2. 부모-자식 관계 맺기
    const roots: ProjectTask[] = [];
    clonedTasks.forEach(task => {
      if (task.parentId) {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(task);
        } else {
          // 부모 ID는 지정되어 있으나 리스트에 부모가 없다면 루트로 취급
          roots.push(task);
        }
      } else {
        roots.push(task);
      }
    });

    // 3. 후위 순회(Post-order) DFS를 활용한 하향식 속성 집계
    const visited = new Set<string>();

    const aggregateNode = (node: ProjectTask) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      // 자식 노드가 있다면 먼저 깊이 우선으로 들어가서 집계 완료 처리
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => aggregateNode(child));
        // 자식들 연산이 모두 끝난 후에 부모 노드의 집계 로직 수행
        node.aggregateFromChildren(node.children);
      }
    };

    // 모든 루트에 대해 집계 동작 수행
    roots.forEach(root => aggregateNode(root));

    return roots;
  }

  /**
   * 트리 노드 리스트를 받아서 깊이 우선 탐색(Pre-order) 방식으로 다시 1차원 플랫 리스트로 펼칩니다.
   * 간트 차트 좌측 리스트 렌더링에 알맞는 계층 순서가 보장됩니다.
   */
  public static flattenTree(tree: ProjectTask[]): ProjectTask[] {
    const flatList: ProjectTask[] = [];

    const traverse = (node: ProjectTask) => {
      flatList.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    };

    tree.forEach(node => traverse(node));
    return flatList;
  }
}
