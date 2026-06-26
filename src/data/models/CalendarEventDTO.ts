import { CalendarEvent, CalendarEventType, CalendarEventCategory } from '../../domain/entities/CalendarEvent';

/**
 * Life OS Dashboard - CalendarEvent DTO (데이터 전송 객체) & Mapper
 * 
 * [설명]
 * 1. 로컬스토리지 JSON 직렬화에 적합한 데이터 전송 규격을 정의합니다.
 * 2. 타입 검증과 데이터 샌디타이징을 거쳐 도메인 경계로 안전하게 데이터를 매핑해 주는 DTO 패턴입니다.
 * 3. 기간 지정을 지원하기 위해 종료일(endDate) 및 종료시간(endTime)을 필드로 포함합니다.
 */

export interface CalendarEventDTO {
  id: string;
  title: string;
  date: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  type: string;
  isCompleted?: boolean;
  category: string;
}

export class CalendarEventDTOMapper {
  /**
   * Raw DTO를 도메인 엔티티로 변환합니다.
   * @throws {Error} 데이터 구조적 유효성에 실패했을 경우 예외 방출
   */
  public static toEntity(dto: CalendarEventDTO): CalendarEvent {
    this.validate(dto);

    // 타입 유효 범위 좁히기
    let validType: CalendarEventType = 'event';
    if (dto.type === 'deadline') {
      validType = 'deadline';
    }

    let validCategory: CalendarEventCategory = 'work';
    if (['work', 'life', 'health', 'growth'].includes(dto.category)) {
      validCategory = dto.category as CalendarEventCategory;
    }

    return new CalendarEvent({
      id: dto.id,
      title: dto.title,
      date: dto.date,
      time: dto.time,
      endDate: dto.endDate,
      endTime: dto.endTime,
      type: validType,
      isCompleted: dto.isCompleted,
      category: validCategory
    });
  }

  /**
   * 도메인 엔티티를 DTO 객체로 변환합니다.
   */
  public static fromEntity(entity: CalendarEvent): CalendarEventDTO {
    return {
      id: entity.id,
      title: entity.title,
      date: entity.date,
      time: entity.time,
      endDate: entity.endDate,
      endTime: entity.endTime,
      type: entity.type,
      isCompleted: entity.isCompleted,
      category: entity.category
    };
  }

  /**
   * DTO 구조 유효성 검사
   */
  public static validate(dto: CalendarEventDTO): void {
    if (!dto) {
      throw new Error('데이터 DTO가 존재하지 않습니다.');
    }
    if (typeof dto.id !== 'string' || dto.id.trim() === '') {
      throw new Error('올바르지 않은 식별자(ID) 데이터 유형입니다.');
    }
    if (typeof dto.title !== 'string') {
      throw new Error('일정 타이틀 데이터 유형은 문자열이어야 합니다.');
    }
    if (typeof dto.date !== 'string') {
      throw new Error('일정 날짜 데이터 유형은 문자열이어야 합니다.');
    }
    if (typeof dto.type !== 'string') {
      throw new Error('일정 타입 데이터 유형은 문자열이어야 합니다.');
    }
    if (typeof dto.category !== 'string') {
      throw new Error('일정 카테고리 데이터 유형은 문자열이어야 합니다.');
    }
    if (dto.endDate !== undefined && typeof dto.endDate !== 'string') {
      throw new Error('종료 날짜 데이터 유형은 문자열이어야 합니다.');
    }
    if (dto.endTime !== undefined && typeof dto.endTime !== 'string') {
      throw new Error('종료 시간 데이터 유형은 문자열이어야 합니다.');
    }
  }
}

