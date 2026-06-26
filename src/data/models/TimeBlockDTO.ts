import { TimeBlock, TimeBlockCategory } from '../../domain/entities/TimeBlock';

/**
 * Life OS Dashboard - TimeBlock 데이터 전송 객체 (DTO) & Mapper
 * 
 * [설명]
 * 1. 로컬 저장소(LocalStorage) 및 외부 JSON 직렬화에 적합한 데이터 전송 규격을 정의합니다.
 * 2. 타입 검증과 데이터 샌디타이징을 거쳐 도메인 경계로 안전하게 데이터를 매핑해 주는 DTO 패턴입니다.
 */

export interface TimeBlockDTO {
  id: string;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  category: string; // 도메인 이외의 문자열 타입 입력을 안전하게 처리
}

export class TimeBlockDTOMapper {
  /**
   * Raw DTO를 도메인 엔티티로 변환합니다.
   * @throws {Error} 데이터 구조적 유효성에 실패했을 경우 예외 방출
   */
  public static toEntity(dto: TimeBlockDTO): TimeBlock {
    this.validate(dto);

    // 카테고리 유효 타입 좁히기
    let validCategory: TimeBlockCategory = 'work';
    if (['work', 'life', 'health', 'growth'].includes(dto.category)) {
      validCategory = dto.category as TimeBlockCategory;
    }

    return new TimeBlock({
      id: dto.id,
      title: dto.title,
      startHour: dto.startHour,
      startMinute: dto.startMinute,
      endHour: dto.endHour,
      endMinute: dto.endMinute,
      category: validCategory
    });
  }

  /**
   * 도메인 엔티티를 직렬화용 DTO 객체로 변환합니다.
   */
  public static fromEntity(entity: TimeBlock): TimeBlockDTO {
    return {
      id: entity.id,
      title: entity.title,
      startHour: entity.startHour,
      startMinute: entity.startMinute,
      endHour: entity.endHour,
      endMinute: entity.endMinute,
      category: entity.category
    };
  }

  /**
   * DTO 객체의 기본 형식 및 타입 제약을 검사합니다.
   */
  public static validate(dto: TimeBlockDTO): void {
    if (!dto) {
      throw new Error('데이터 전송 객체(DTO)가 정의되지 않았습니다.');
    }
    if (typeof dto.id !== 'string' || dto.id.trim() === '') {
      throw new Error('올바르지 않은 일정 식별자(ID) 데이터 유형입니다.');
    }
    if (typeof dto.title !== 'string') {
      throw new Error('일정 타이틀 데이터 유형은 문자열이어야 합니다.');
    }
    if (
      typeof dto.startHour !== 'number' ||
      typeof dto.startMinute !== 'number' ||
      typeof dto.endHour !== 'number' ||
      typeof dto.endMinute !== 'number'
    ) {
      throw new Error('시각 및 분 정보의 데이터 유형은 숫자(Number)여야 합니다.');
    }
  }
}
