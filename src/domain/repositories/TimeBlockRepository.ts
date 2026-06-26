import { TimeBlock } from '../entities/TimeBlock';

/**
 * Life OS Dashboard - TimeBlock 저장소 명세 인터페이스
 * 
 * [설명]
 * 1. 클린 아키텍처 원칙에 입각하여 Data Layer의 영속성 구현체가 지켜야 할 일관된 행동 명세를 정의합니다.
 * 2. 특정 데이터 저장 장치(LocalStorage, Firebase 등)에 얽매이지 않는 순수 추상 계약서 역할을 수행합니다.
 */
export interface TimeBlockRepository {
  /**
   * 전체 타임블록 목록을 조회하여 반환합니다.
   */
  getTimeBlocks(): Promise<TimeBlock[]>;

  /**
   * 단일 타임블록 일정을 저장(추가/업데이트)합니다.
   */
  saveTimeBlock(timeBlock: TimeBlock): Promise<void>;

  /**
   * 지정한 ID를 가진 타임블록 일정을 삭제합니다.
   */
  deleteTimeBlock(id: string): Promise<void>;
}
