import { CalendarEvent } from '../entities/CalendarEvent';

/**
 * Life OS Dashboard - CalendarEvent 저장소 명세 인터페이스
 * 
 * [설명]
 * 1. 클린 아키텍처 원칙에 입각하여 Data Layer의 영속성 구현체가 지켜야 할 일관된 행동 명세를 정의합니다.
 */
export interface CalendarEventRepository {
  /**
   * 전체 캘린더 일정(이벤트 및 데드라인) 목록을 조회하여 반환합니다.
   */
  getEvents(): Promise<CalendarEvent[]>;

  /**
   * 단일 일정 정보를 저장(추가/업데이트)합니다.
   */
  saveEvent(event: CalendarEvent): Promise<void>;

  /**
   * 지정한 ID를 가진 일정을 삭제합니다.
   */
  deleteEvent(id: string): Promise<void>;

  /**
   * 지정한 ID를 가진 일정(데드라인)의 완료 여부를 토글합니다.
   */
  toggleEventCompletion(id: string): Promise<void>;
}
