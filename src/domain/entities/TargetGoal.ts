/**
 * Life OS Dashboard - TargetGoal 도메인 엔티티
 * 
 * [설명]
 * 사용자가 이루고자 하는 단기(주간), 중기(연간), 장기(생애) 목표를 나타내는 핵심 비즈니스 엔티티입니다.
 * 특정 데이터베이스나 라이브러리 상세에 의존하지 않는 순수한 TypeScript 로직만을 포함합니다.
 */

// 목표 주기 구분 타입
export type GoalPeriod = 'weekly' | 'yearly' | 'lifetime';

// 목표 카테고리 구분 타입
export type GoalCategory = 'work' | 'life' | 'health' | 'growth';

// 목표 하위 할 일 인터페이스 정의
export interface GoalTodo {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export class TargetGoal {
  public id: string;
  public title: string;
  public period: GoalPeriod;
  public category: GoalCategory;
  public progress: number; // 0 ~ 100 사이의 정수
  public isCompleted: boolean;
  public createdAt: string;
  public todos: GoalTodo[]; // 하위 할 일 목록 추가

  constructor(params: {
    id: string;
    title: string;
    period: GoalPeriod;
    category: GoalCategory;
    progress?: number;
    isCompleted?: boolean;
    createdAt?: string;
    todos?: GoalTodo[];
  }) {
    // 1. 필수 비즈니스 규칙 검증 (Validation)
    if (!params.title || params.title.trim() === '') {
      throw new Error('목표의 제목은 빈 칸일 수 없습니다.');
    }
    
    const progressVal = params.progress ?? 0;
    if (progressVal < 0 || progressVal > 100) {
      throw new Error('목표 진척도는 0%에서 100% 사이여야 합니다.');
    }

    // 2. 도메인 속성 초기화
    this.id = params.id;
    this.title = params.title.trim();
    this.period = params.period;
    this.category = params.category;
    this.todos = params.todos ?? [];
    this.createdAt = params.createdAt ?? new Date().toISOString();

    // 3. 할 일 목록 유무에 따른 진척도 계산 규칙 적용
    if (this.todos.length > 0) {
      this.progress = 0; // recalculateProgress 내에서 갱신됨
      this.isCompleted = false;
      this.recalculateProgress();
    } else {
      this.progress = progressVal;
      this.isCompleted = params.isCompleted ?? (progressVal === 100);
    }
  }

  /**
   * 할 일 상태에 기반하여 진척도(progress)와 완료여부(isCompleted)를 자동 재계산
   */
  private recalculateProgress(): void {
    if (this.todos.length > 0) {
      const completedCount = this.todos.filter((t) => t.isCompleted).length;
      this.progress = Math.round((completedCount / this.todos.length) * 100);
      this.isCompleted = (this.progress === 100);
    }
  }

  /**
   * 진척도 업데이트 비즈니스 메서드
   * 
   * [역할]
   * 진척도를 변경하고, 만약 진척도가 100%에 도달하면 자동으로 완료 처리합니다.
   * (단, 하위 할 일이 있는 목표의 경우 수동 변경을 가드합니다.)
   */
  public updateProgress(newProgress: number): void {
    if (this.todos.length > 0) {
      throw new Error('하위 할 일이 등록된 목표는 진척도를 수동으로 변경할 수 없습니다.');
    }

    if (newProgress < 0 || newProgress > 100) {
      throw new Error('목표 진척도는 0%에서 100% 사이여야 합니다.');
    }
    
    this.progress = newProgress;
    this.isCompleted = (newProgress === 100);
  }

  /**
   * 완료 여부 직접 토글 비즈니스 메서드
   * 
   * [역할]
   * 완료를 수동으로 전환 시 진척도를 0% 혹은 100%로 적절히 맞춰줍니다.
   * 할 일이 있는 목표라면 모든 하위 할 일도 일괄적으로 토글합니다.
   */
  public toggleComplete(): void {
    if (this.todos.length > 0) {
      const nextState = !this.isCompleted;
      this.todos.forEach((t) => {
        t.isCompleted = nextState;
      });
      this.recalculateProgress();
    } else {
      this.isCompleted = !this.isCompleted;
      if (this.isCompleted) {
        this.progress = 100;
      } else if (this.progress === 100) {
        this.progress = 0;
      }
    }
  }

  /**
   * 하위 할 일 추가 비즈니스 메서드
   */
  public addTodo(todo: GoalTodo): void {
    if (!todo.title || todo.title.trim() === '') {
      throw new Error('할 일의 제목은 빈 칸일 수 없습니다.');
    }
    this.todos.push({
      ...todo,
      title: todo.title.trim()
    });
    this.recalculateProgress();
  }

  /**
   * 하위 할 일 삭제 비즈니스 메서드
   */
  public removeTodo(todoId: string): void {
    this.todos = this.todos.filter((t) => t.id !== todoId);
    this.recalculateProgress();
  }

  /**
   * 하위 할 일 토글 비즈니스 메서드
   */
  public toggleTodo(todoId: string): void {
    const todo = this.todos.find((t) => t.id === todoId);
    if (todo) {
      todo.isCompleted = !todo.isCompleted;
      this.recalculateProgress();
    }
  }

  /**
   * 하위 할 일 제목 수정 비즈니스 메서드
   */
  public updateTodoTitle(todoId: string, newTitle: string): void {
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('할 일의 제목은 빈 칸일 수 없습니다.');
    }
    const todo = this.todos.find((t) => t.id === todoId);
    if (todo) {
      todo.title = newTitle.trim();
    }
  }
}
