import { ProjectTaskRepository } from '@/domain/repositories/ProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';
import { ProjectTaskDTO, ProjectTaskMapper } from '../models/ProjectTaskDTO';

/**
 * Life OS Dashboard - LocalStorageProjectTaskRepository 구현체
 * 
 * [역할]
 * ProjectTaskRepository 인터페이스의 명세를 구현하여 브라우저 로컬 스토리지에
 * 프로젝트 태스크 데이터를 영구 저장하고 무결하게 복원합니다.
 */
export class LocalStorageProjectTaskRepository implements ProjectTaskRepository {
  private readonly STORAGE_KEY = 'offgravity-project-tasks';

  /**
   * 로컬 스토리지 데이터 접근 가능 여부 판단 헬퍼
   */
  private isBrowserAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 로컬 스토리지의 모든 데이터 조회 및 도메인 모델 전환
   */
  public async getAll(): Promise<ProjectTask[]> {
    if (!this.isBrowserAvailable()) {
      return [];
    }

    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) {
        return [];
      }

      const dtos: ProjectTaskDTO[] = JSON.parse(rawData);
      
      // DTO 리스트를 순수 도메인 엔티티 리스트로 매핑하여 반환
      return dtos.map((dto) => ProjectTaskMapper.toDomain(dto));
    } catch (error) {
      console.error('로컬스토리지 프로젝트 태스크 조회 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 특정 ID의 태스크 개별 조회
   */
  public async getById(id: string): Promise<ProjectTask | null> {
    const tasks = await this.getAll();
    const found = tasks.find((t) => t.id === id);
    return found || null;
  }

  /**
   * 태스크 추가 또는 변경 사항 저장
   */
  public async save(task: ProjectTask): Promise<void> {
    if (!this.isBrowserAvailable()) {
      return;
    }

    try {
      const tasks = await this.getAll();
      const dtoToSave = ProjectTaskMapper.toDTO(task);
      const existingIndex = tasks.findIndex((t) => t.id === task.id);

      if (existingIndex >= 0) {
        // 기존 태스크 수정 덮어쓰기
        const rawData = localStorage.getItem(this.STORAGE_KEY);
        if (rawData) {
          const dtos: ProjectTaskDTO[] = JSON.parse(rawData);
          dtos[existingIndex] = dtoToSave;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos));
        }
      } else {
        // 신규 태스크 추가
        const rawData = localStorage.getItem(this.STORAGE_KEY);
        const dtos: ProjectTaskDTO[] = rawData ? JSON.parse(rawData) : [];
        dtos.push(dtoToSave);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos));
      }
    } catch (error) {
      console.error('로컬스토리지 프로젝트 태스크 저장 중 오류 발생:', error);
    }
  }

  /**
   * 특정 ID의 태스크 삭제
   */
  public async delete(id: string): Promise<void> {
    if (!this.isBrowserAvailable()) {
      return;
    }

    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) return;

      const dtos: ProjectTaskDTO[] = JSON.parse(rawData);
      const filtered = dtos.filter((dto) => dto.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('로컬스토리지 프로젝트 태스크 삭제 중 오류 발생:', error);
    }
  }
}
