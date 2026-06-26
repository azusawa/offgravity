import { TargetGoal, GoalPeriod, GoalCategory, GoalTodo } from '@/domain/entities/TargetGoal';

/**
 * Life OS Dashboard - TargetGoal 데이터 전송 객체 (DTO) 및 매퍼
 * 
 * [설명]
 * LocalStorage에 저장되거나 전송될 때 사용되는 TargetGoal의 원시 데이터 구조(DTO)를 정의합니다.
 * 도메인 엔티티의 불변 객체 비즈니스 규칙과 영속화 데이터 사이의 불일치를 해소하는
 * 데이터 교환 매핑 로직(Mapper)을 포함합니다.
 */

// LocalStorage에 직렬화되어 저장될 데이터 규격
export interface TargetGoalDTO {
  id: string;
  title: string;
  period: string; // 'weekly' | 'yearly' | 'lifetime'
  category: string; // 'work' | 'life' | 'health' | 'growth'
  progress: number;
  isCompleted: boolean;
  createdAt: string;
  todos?: GoalTodo[]; // 하위 할 일 목록 DTO 규격에 추가
}

export class TargetGoalMapper {
  /**
   * DTO 객체를 도메인 엔티티(TargetGoal) 객체로 변환
   */
  public static toDomain(dto: TargetGoalDTO): TargetGoal {
    return new TargetGoal({
      id: dto.id,
      title: dto.title,
      period: dto.period as GoalPeriod,
      category: dto.category as GoalCategory,
      progress: dto.progress,
      isCompleted: dto.isCompleted,
      createdAt: dto.createdAt,
      todos: dto.todos ?? [], // 이전 데이터에 todos가 없을 경우 빈 배열로 방어
    });
  }

  /**
   * 도메인 엔티티 객체를 직렬화 가능한 DTO 객체로 변환
   */
  public static toDTO(domain: TargetGoal): TargetGoalDTO {
    return {
      id: domain.id,
      title: domain.title,
      period: domain.period,
      category: domain.category,
      progress: domain.progress,
      isCompleted: domain.isCompleted,
      createdAt: domain.createdAt,
      todos: domain.todos,
    };
  }
}
