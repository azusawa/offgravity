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

export class TargetGoal {
  public id: string;
  public title: string;
  public period: GoalPeriod;
  public category: GoalCategory;
  public progress: number; // 0 ~ 100 사이의 정수
  public isCompleted: boolean;
  public createdAt: string;

  constructor(params: {
    id: string;
    title: string;
    period: GoalPeriod;
    category: GoalCategory;
    progress?: number;
    isCompleted?: boolean;
    createdAt?: string;
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
    this.progress = progressVal;
    this.isCompleted = params.isCompleted ?? (progressVal === 100);
    this.createdAt = params.createdAt ?? new Date().toISOString();
  }

  /**
   * 진척도 업데이트 비즈니스 메서드
   * 
   * [역할]
   * 진척도를 변경하고, 만약 진척도가 100%에 도달하면 자동으로 완료 처리합니다.
   */
  public updateProgress(newProgress: number): void {
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
   */
  public toggleComplete(): void {
    this.isCompleted = !this.isCompleted;
    if (this.isCompleted) {
      this.progress = 100;
    } else if (this.progress === 100) {
      this.progress = 0;
    }
  }
}
