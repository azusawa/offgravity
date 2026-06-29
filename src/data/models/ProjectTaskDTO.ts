import { ProjectTask, TaskStatus, TaskType } from '@/domain/entities/ProjectTask';

/**
 * Life OS Dashboard - ProjectTask 데이터 전송 객체 (DTO) 및 매퍼
 * 
 * [설명]
 * LocalStorage에 저장될 태스크의 직렬화 가능 규격(DTO) 및 
 * 도메인 모델과 DTO 간 변환 로직(Mapper)을 포함합니다.
 */

export interface ProjectTaskDTO {
  id: string;
  title: string;
  description: string;
  status: string; // 'todo' | 'in_progress' | 'done'
  startDate: string;
  endDate: string;
  progress: number;
  createdAt: string;
  type: string; // 'task' | 'group'
  isGroup?: boolean;
  parentId: string | null;
}

export class ProjectTaskMapper {
  /**
   * DTO 객체를 순수 도메인 엔티티 객체로 변환
   */
  public static toDomain(dto: ProjectTaskDTO): ProjectTask {
    return new ProjectTask({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status as TaskStatus,
      startDate: dto.startDate,
      endDate: dto.endDate,
      progress: dto.progress,
      createdAt: dto.createdAt,
      type: dto.type as TaskType, // 안전 컴파일 캐스팅
      isGroup: dto.isGroup,
      parentId: dto.parentId,
    });
  }

  /**
   * 도메인 엔티티 객체를 직렬화 가능한 DTO 객체로 변환
   */
  public static toDTO(domain: ProjectTask): ProjectTaskDTO {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      status: domain.status,
      startDate: domain.startDate,
      endDate: domain.endDate,
      progress: domain.progress,
      createdAt: domain.createdAt,
      type: domain.type,
      isGroup: domain.type === 'group',
      parentId: domain.parentId,
    };
  }
}
