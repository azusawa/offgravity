/**
 * Life OS Dashboard - TimeBlock 도메인 엔티티
 * 
 * [설명]
 * 1. 하루 일과 중 특정 시간 영역을 채우는 스케줄 단위입니다.
 * 2. Clean Architecture 원칙에 따라 데이터베이스나 UI 프레임워크 상세에 절대 의존하지 않는 순수 비즈니스 모델입니다.
 * 3. 시작 시각/분 및 종료 시각/분이 하루 범위(00:00 ~ 23:59) 내에 적법하게 존재하는지 검증하며,
 *    시작 시간이 종료 시간보다 같거나 늦을 수 없다는 핵심 제약 요건을 통제합니다.
 */

export type TimeBlockCategory = 'work' | 'life' | 'health' | 'growth';

export interface TimeBlockProps {
  id: string;
  title: string;
  startHour: number;     // 0 ~ 23
  startMinute: number;   // 0 ~ 59
  endHour: number;       // 0 ~ 23
  endMinute: number;     // 0 ~ 59
  category: TimeBlockCategory;
}

export class TimeBlock {
  public readonly id: string;
  public readonly title: string;
  public readonly startHour: number;
  public readonly startMinute: number;
  public readonly endHour: number;
  public readonly endMinute: number;
  public readonly category: TimeBlockCategory;

  constructor(props: TimeBlockProps) {
    // 도메인 핵심 제약 요건 검증 수행
    TimeBlock.validate(props);

    this.id = props.id;
    this.title = props.title.trim();
    this.startHour = props.startHour;
    this.startMinute = props.startMinute;
    this.endHour = props.endHour;
    this.endMinute = props.endMinute;
    this.category = props.category;
  }

  /**
   * 도메인 비즈니스 제약식 검증 함수
   * @throws {Error} 유효 조건에 어긋날 때 한글 예외 메시지 송출
   */
  public static validate(props: TimeBlockProps): void {
    if (!props.id) {
      throw new Error('일정 식별자(ID)가 누락되었습니다.');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('일정의 명칭을 1자 이상 입력해 주세요.');
    }
    if (props.title.trim().length > 40) {
      throw new Error('일정의 명칭은 최대 40자까지 작성할 수 있습니다.');
    }

    // 시간 입력 범위 유효성 체크
    if (props.startHour < 0 || props.startHour > 23 || props.endHour < 0 || props.endHour > 23) {
      throw new Error('시각 정보는 0시부터 23시 사이로 기입해야 합니다.');
    }
    if (props.startMinute < 0 || props.startMinute > 59 || props.endMinute < 0 || props.endMinute > 59) {
      throw new Error('분 정보는 0분부터 59분 사이로 기입해야 합니다.');
    }

    // 선후 관계 검증 (시작 시간 < 종료 시간)
    const startTotal = props.startHour * 60 + props.startMinute;
    const endTotal = props.endHour * 60 + props.endMinute;

    if (startTotal >= endTotal) {
      throw new Error('시작 시간이 종료 시간보다 같거나 늦을 수 없습니다.');
    }
  }

  /**
   * 해당 일정의 총 소요 시간(분 단위)을 반환하는 비즈니스 연산 함수
   */
  public get durationMinutes(): number {
    const startTotal = this.startHour * 60 + this.startMinute;
    const endTotal = this.endHour * 60 + this.endMinute;
    return endTotal - startTotal;
  }

  /**
   * 시각과 분을 합친 비교용 원시 숫자 값을 반환 (예: 09:30 -> 930)
   */
  public get rawStartTime(): number {
    return this.startHour * 100 + this.startMinute;
  }

  public get rawEndTime(): number {
    return this.endHour * 100 + this.endMinute;
  }
}
