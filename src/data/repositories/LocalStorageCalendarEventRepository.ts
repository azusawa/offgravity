import { CalendarEventRepository } from '../../domain/repositories/CalendarEventRepository';
import { CalendarEvent } from '../../domain/entities/CalendarEvent';
import { CalendarEventDTO, CalendarEventDTOMapper } from '../models/CalendarEventDTO';

/**
 * Life OS Dashboard - LocalStorage 기반 CalendarEvent 저장소 구현체
 * 
 * [설명]
 * 1. 브라우저의 로컬 스토리지에 캘린더 일정 및 데드라인 정보를 저장하는 Data 레이어 모듈입니다.
 * 2. SSR(서버사이드 렌더링) 도중 window 객체 미정의로 발생하는 에러 방지를 위해 window 가드를 구현했습니다.
 */
export class LocalStorageCalendarEventRepository implements CalendarEventRepository {
  private readonly STORAGE_KEY = 'life-os-calendar-events';

  /**
   * 로컬 스토리지 접근 가능 여부
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 전체 캘린더 일정 목록 조회
   */
  public async getEvents(): Promise<CalendarEvent[]> {
    if (!this.isBrowser()) {
      return [];
    }

    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      if (!dataStr) {
        return [];
      }

      const rawList: CalendarEventDTO[] = JSON.parse(dataStr);
      if (!Array.isArray(rawList)) {
        return [];
      }

      // DTO를 도메인 엔티티로 매핑하여 반환
      return rawList
        .map((dto) => {
          try {
            return CalendarEventDTOMapper.toEntity(dto);
          } catch (err) {
            console.error('CalendarEvent DTO 매핑 실패 스킵:', err);
            return null;
          }
        })
        .filter((event): event is CalendarEvent => event !== null);
    } catch (error) {
      console.error('LocalStorage 캘린더 조회 에러:', error);
      return [];
    }
  }

  /**
   * 단일 일정 저장 (추가 및 정보 수정)
   */
  public async saveEvent(event: CalendarEvent): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const events = await this.getEvents();
      const updatedDTOs = events
        .filter((e) => e.id !== event.id)
        .concat(event)
        .map((e) => CalendarEventDTOMapper.fromEntity(e));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDTOs));
    } catch (error) {
      console.error('LocalStorage 캘린더 저장 에러:', error);
      throw new Error('일정을 저장하는 도중 오류가 발생했습니다.');
    }
  }

  /**
   * 일정 삭제
   */
  public async deleteEvent(id: string): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const events = await this.getEvents();
      const filteredDTOs = events
        .filter((e) => e.id !== id)
        .map((e) => CalendarEventDTOMapper.fromEntity(e));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDTOs));
    } catch (error) {
      console.error('LocalStorage 캘린더 삭제 에러:', error);
      throw new Error('일정을 삭제하는 도중 오류가 발생했습니다.');
    }
  }

  /**
   * 데드라인 완료 상태 여부 전환
   */
  public async toggleEventCompletion(id: string): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const events = await this.getEvents();
      const target = events.find((e) => e.id === id);
      if (!target) {
        throw new Error('대상 일정을 찾을 수 없습니다.');
      }

      // 도메인 내부 toggleCompletion 비즈니스 규칙 활용 (불변 상태 지향)
      const updatedTarget = target.toggleCompletion();
      await this.saveEvent(updatedTarget);
    } catch (error) {
      console.error('LocalStorage 데드라인 토글 에러:', error);
      throw new Error('마감 일정 상태를 변경하는 도중 오류가 발생했습니다.');
    }
  }
}
