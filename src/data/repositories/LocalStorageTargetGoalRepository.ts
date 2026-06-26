import { TargetGoalRepository } from '@/domain/repositories/TargetGoalRepository';
import { TargetGoal } from '@/domain/entities/TargetGoal';
import { TargetGoalDTO, TargetGoalMapper } from '../models/TargetGoalDTO';

/**
 * Life OS Dashboard - LocalStorageTargetGoalRepository 구현체
 * 
 * [역할]
 * 1. TargetGoalRepository 인터페이스를 상속받아 브라우저 로컬 스토리지에 목표 정보를 영구 보존합니다.
 * 2. Next.js SSR(서버 사이드 렌더링) 환경에서도 호출될 수 있도록 window 객체 유무 가드를 수행합니다.
 * 3. 직렬화 과정에서 TargetGoalDTO와 Mapper를 활용하여 도메인 비즈니스 규칙의 무결성을 깨뜨리지 않고 적재합니다.
 */
export class LocalStorageTargetGoalRepository implements TargetGoalRepository {
  private readonly STORAGE_KEY = 'offgravity-target-goals';

  /**
   * 로컬 스토리지 데이터 접근 가능 여부 판단 헬퍼
   */
  private isBrowserAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 로컬 스토리지의 모든 데이터 조회 및 도메인 모델 전환
   */
  public async getAll(): Promise<TargetGoal[]> {
    if (!this.isBrowserAvailable()) {
      return [];
    }

    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) {
        return [];
      }

      const dtos: TargetGoalDTO[] = JSON.parse(rawData);
      
      // DTO 리스트를 순수 도메인 엔티티 리스트로 매핑하여 반환
      return dtos.map((dto) => TargetGoalMapper.toDomain(dto));
    } catch (error) {
      console.error('로컬스토리지 목표 조회 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 특정 ID의 목표 개별 조회
   */
  public async getById(id: string): Promise<TargetGoal | null> {
    const goals = await this.getAll();
    const found = goals.find((goal) => goal.id === id);
    return found || null;
  }

  /**
   * 목표 추가 또는 변경 사항 저장
   */
  public async save(goal: TargetGoal): Promise<void> {
    if (!this.isBrowserAvailable()) {
      return;
    }

    try {
      const goals = await this.getAll();
      const dtoToSave = TargetGoalMapper.toDTO(goal);
      
      const existingIndex = goals.findIndex((g) => g.id === goal.id);
      
      if (existingIndex >= 0) {
        // 이미 존재하는 목표인 경우 수정 덮어쓰기
        const rawData = localStorage.getItem(this.STORAGE_KEY);
        if (rawData) {
          const dtos: TargetGoalDTO[] = JSON.parse(rawData);
          dtos[existingIndex] = dtoToSave;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos));
        }
      } else {
        // 신규 목표인 경우 뒤에 푸시 추가
        const rawData = localStorage.getItem(this.STORAGE_KEY);
        const dtos: TargetGoalDTO[] = rawData ? JSON.parse(rawData) : [];
        dtos.push(dtoToSave);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos));
      }
    } catch (error) {
      console.error('로컬스토리지 목표 저장 중 오류 발생:', error);
    }
  }

  /**
   * 특정 ID의 목표 영구 삭제
   */
  public async delete(id: string): Promise<void> {
    if (!this.isBrowserAvailable()) {
      return;
    }

    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) return;

      const dtos: TargetGoalDTO[] = JSON.parse(rawData);
      const filtered = dtos.filter((dto) => dto.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('로컬스토리지 목표 삭제 중 오류 발생:', error);
    }
  }
}
