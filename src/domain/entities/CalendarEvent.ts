/**
 * Life OS Dashboard - CalendarEvent 도메인 엔티티
 * 
 * [설명]
 * 1. 특정 일자의 일정(이벤트) 및 완료 여부를 지닌 마감(데드라인) 할 일 정보를 다루는 도메인 핵심 모델입니다.
 * 2. 날짜 YYYY-MM-DD 형식과 시간 HH:mm 형식에 대한 정규식 기반 유효성 검증을 책임집니다.
 * 3. 기간 일정(시작~종료) 설정을 지원하며 이에 대한 비즈니스 제약식 검증이 포함되어 있습니다.
 * 4. 클린 아키텍처 규칙에 따라 영속성 및 외부 UI 모듈에 대해 비의존적입니다.
 */

export type CalendarEventType = 'event' | 'deadline';
export type CalendarEventCategory = 'work' | 'life' | 'health' | 'growth';

export interface CalendarEventProps {
  id: string;
  title: string;
  date: string;               // YYYY-MM-DD
  time?: string;              // HH:mm (선택 입력)
  endDate?: string;           // YYYY-MM-DD (기간 일정의 종료일, 선택)
  endTime?: string;           // HH:mm (기간 일정의 종료시간, 선택)
  type: CalendarEventType;
  isCompleted?: boolean;      // 데드라인 할 일의 완료 상태 여부
  category: CalendarEventCategory;
}

export class CalendarEvent {
  public readonly id: string;
  public readonly title: string;
  public readonly date: string;
  public readonly time?: string;
  public readonly endDate?: string;
  public readonly endTime?: string;
  public readonly type: CalendarEventType;
  public readonly isCompleted: boolean;
  public readonly category: CalendarEventCategory;

  constructor(props: CalendarEventProps) {
    CalendarEvent.validate(props);

    this.id = props.id;
    this.title = props.title.trim();
    this.date = props.date;
    this.time = props.time;
    this.endDate = props.endDate;
    this.endTime = props.endTime;
    this.type = props.type;
    this.isCompleted = props.isCompleted ?? false;
    this.category = props.category;
  }

  /**
   * 도메인 비즈니스 제약식 검증 함수
   * @throws {Error} 형식 불일치 시 예외 메시지 송출
   */
  public static validate(props: CalendarEventProps): void {
    if (!props.id) {
      throw new Error('일정 식별자(ID)가 누락되었습니다.');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('일정의 명칭을 1자 이상 입력해 주세요.');
    }
    if (props.title.trim().length > 50) {
      throw new Error('일정의 명칭은 최대 50자까지 입력 가능합니다.');
    }

    // 날짜 포맷 검사 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(props.date)) {
      throw new Error('날짜는 YYYY-MM-DD 포맷을 준수해야 합니다.');
    }

    // 시간 입력이 존재할 시 포맷 검사 (HH:mm)
    if (props.time) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(props.time)) {
        throw new Error('시간 정보는 HH:mm 포맷을 준수해야 합니다.');
      }
      
      const [hour, minute] = props.time.split(':').map(Number);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error('올바르지 않은 시/분 범위가 입력되었습니다.');
      }
    }

    // 종료일 포맷 검사 (YYYY-MM-DD)
    if (props.endDate) {
      if (!dateRegex.test(props.endDate)) {
        throw new Error('종료 날짜는 YYYY-MM-DD 포맷을 준수해야 합니다.');
      }

      // 날짜 선후 관계 비교
      if (props.date > props.endDate) {
        throw new Error('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      }
    }

    // 종료시간 포맷 검사 (HH:mm)
    if (props.endTime) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(props.endTime)) {
        throw new Error('종료 시간 정보는 HH:mm 포맷을 준수해야 합니다.');
      }

      const [hour, minute] = props.endTime.split(':').map(Number);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error('올바르지 않은 종료 시/분 범위가 입력되었습니다.');
      }

      // 종료일이 있어야 종료시간도 의미가 있음
      if (!props.endDate) {
        throw new Error('종료 시간이 설정된 경우 종료 날짜가 지정되어야 합니다.');
      }
    }

    // 시작일과 종료일이 같을 때, 시작 시간과 종료 시간의 선후 관계 비교
    if (props.endDate && props.date === props.endDate && props.time && props.endTime) {
      if (props.time > props.endTime) {
        throw new Error('종료 시간은 시작 시간보다 빠를 수 없습니다.');
      }
    }
  }

  /**
   * 데드라인(할 일)의 완료 유무 상태를 토글한 신규 인스턴스를 반환합니다. (불변 객체 지향)
   */
  public toggleCompletion(): CalendarEvent {
    if (this.type !== 'deadline') {
      throw new Error('이벤트 유형의 일정은 완료 여부를 제어할 수 없습니다.');
    }
    return new CalendarEvent({
      id: this.id,
      title: this.title,
      date: this.date,
      time: this.time,
      endDate: this.endDate,
      endTime: this.endTime,
      type: this.type,
      isCompleted: !this.isCompleted,
      category: this.category
    });
  }

  /**
   * 일정의 속성들을 갱신한 신규 인스턴스를 반환합니다. (불변 객체 지향)
   */
  public update(props: Partial<Omit<CalendarEventProps, 'id'>>): CalendarEvent {
    return new CalendarEvent({
      id: this.id,
      title: props.title ?? this.title,
      date: props.date ?? this.date,
      time: props.time !== undefined ? props.time : this.time,
      endDate: props.endDate !== undefined ? props.endDate : this.endDate,
      endTime: props.endTime !== undefined ? props.endTime : this.endTime,
      type: props.type ?? this.type,
      isCompleted: props.isCompleted ?? this.isCompleted,
      category: props.category ?? this.category
    });
  }
}

