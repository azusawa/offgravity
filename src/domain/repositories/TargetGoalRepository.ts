import { TargetGoal } from '../entities/TargetGoal';

/**
 * Life OS Dashboard - TargetGoalRepository 명세 (인터페이스)
 * 
 * [설명]
 * 목표 데이터를 관리하기 위한 데이터 접근용 저장소 인터페이스입니다.
 * 비즈니스 로직(Domain Layer)이 데이터베이스나 브라우저 LocalStorage 같은
 * 구체적인 인프라 구현 상세에 의존하지 않도록 의존성을 역전(DIP)시킵니다.
 */
export interface TargetGoalRepository {
  /**
   * 전체 목표 목록 조회
   */
  getAll(): Promise<TargetGoal[]>;

  /**
   * 특정 ID를 가진 단일 목표 조회
   */
  getById(id: string): Promise<TargetGoal | null>;

  /**
   * 목표 추가 또는 변경 사항 저장
   */
  save(goal: TargetGoal): Promise<void>;

  /**
   * 특정 ID의 목표 삭제
   */
  delete(id: string): Promise<void>;
}
