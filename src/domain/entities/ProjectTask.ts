export type TaskStatus = 'todo' | 'in_progress' | 'done';

/**
 * Life OS Dashboard - ProjectTask 도메인 엔티티
 * 
 * [설명]
 * 프로젝트 관리 모듈에서 사용되는 개별 태스크(일감)의 순수 비즈니스 엔티티입니다.
 * 칸반 보드의 '상태(Status)'와 간트 차트의 '진척도(Progress)'가 유기적으로 동기화되는 규칙을 내장합니다.
 */
export class ProjectTask {
  public id: string;
  public title: string;
  public description: string;
  public status: TaskStatus;
  public startDate: string; // YYYY-MM-DD
  public endDate: string;   // YYYY-MM-DD
  public progress: number;  // 0 ~ 100
  public createdAt: string;

  constructor(params: {
    id: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    startDate: string;
    endDate: string;
    progress?: number;
    createdAt?: string;
  }) {
    // 1. 필수 유효성 검사 (시작일이 종료일보다 늦을 수 없음)
    if (!params.title || params.title.trim() === '') {
      throw new Error('작업의 제목은 빈 칸일 수 없습니다.');
    }
    if (!params.startDate || !params.endDate) {
      throw new Error('시작일과 종료일은 필수 입력 사항입니다.');
    }
    if (new Date(params.startDate) > new Date(params.endDate)) {
      throw new Error('시작일은 종료일보다 늦을 수 없습니다.');
    }

    const progressVal = params.progress ?? 0;
    if (progressVal < 0 || progressVal > 100) {
      throw new Error('진척도는 0%에서 100% 사이여야 합니다.');
    }

    this.id = params.id;
    this.title = params.title.trim();
    this.description = params.description ?? '';
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.createdAt = params.createdAt ?? new Date().toISOString();

    // 2. 상태(status)와 진척도(progress)의 동기화 초기화
    let initialStatus = params.status ?? 'todo';
    let initialProgress = progressVal;

    if (params.status === 'done') {
      initialProgress = 100;
    } else if (params.status === 'todo' && progressVal > 0) {
      initialStatus = 'in_progress';
    } else if (progressVal === 100) {
      initialStatus = 'done';
    } else if (progressVal > 0 && progressVal < 100) {
      initialStatus = 'in_progress';
    }

    this.status = initialStatus;
    this.progress = initialProgress;
  }

  /**
   * 상태 변경 비즈니스 메서드
   * (상태에 따른 진척도 자동 보정)
   */
  public updateStatus(newStatus: TaskStatus): void {
    this.status = newStatus;
    if (newStatus === 'done') {
      this.progress = 100;
    } else if (newStatus === 'todo') {
      this.progress = 0;
    } else if (newStatus === 'in_progress' && (this.progress === 0 || this.progress === 100)) {
      // 진행 중으로 변경되었는데 progress가 0이거나 100이면 50%로 기본 보정
      this.progress = 50;
    }
  }

  /**
   * 진척도 수정 비즈니스 메서드
   * (진척도에 따른 상태 자동 보정)
   */
  public updateProgress(newProgress: number): void {
    if (newProgress < 0 || newProgress > 100) {
      throw new Error('진척도는 0%에서 100% 사이여야 합니다.');
    }
    this.progress = newProgress;
    
    if (newProgress === 100) {
      this.status = 'done';
    } else if (newProgress === 0) {
      this.status = 'todo';
    } else {
      this.status = 'in_progress';
    }
  }

  /**
   * 날짜 범위 변경 비즈니스 메서드
   */
  public updateDates(startDate: string, endDate: string): void {
    if (!startDate || !endDate) {
      throw new Error('시작일과 종료일은 필수 입력 사항입니다.');
    }
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('시작일은 종료일보다 늦을 수 없습니다.');
    }
    this.startDate = startDate;
    this.endDate = endDate;
  }

  /**
   * 기본 정보(제목, 설명) 변경 비즈니스 메서드
   */
  public updateInfo(title: string, description: string): void {
    if (!title || title.trim() === '') {
      throw new Error('작업의 제목은 빈 칸일 수 없습니다.');
    }
    this.title = title.trim();
    this.description = description;
  }
}
