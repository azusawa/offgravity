import { ProjectTask } from '../entities/ProjectTask';

/**
 * Life OS Dashboard - ProjectTaskRepository 명세 (인터페이스)
 * 
 * [설명]
 * 프로젝트 태스크 데이터를 영속화하거나 제어하기 위한 저장소 인터페이스입니다.
 * DIP(의존성 역전 원칙)를 준수하여 도메인 비즈니스 계층이 구체적인 스토리지 구현에 결합되지 않도록 방지합니다.
 */
export interface ProjectTaskRepository {
  /**
   * 전체 프로젝트 태스크 목록 조회
   */
  getAll(): Promise<ProjectTask[]>;

  /**
   * 특정 ID를 가진 단일 태스크 조회
   */
  getById(id: string): Promise<ProjectTask | null>;

  /**
   * 태스크 저장 또는 변경 사항 업데이트
   */
  save(task: ProjectTask): Promise<void>;

  /**
   * 특정 ID의 태스크 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 모든 태스크 목록의 변경 사항 및 순서 전체 저장
   */
  saveAll(tasks: ProjectTask[]): Promise<void>;
}
