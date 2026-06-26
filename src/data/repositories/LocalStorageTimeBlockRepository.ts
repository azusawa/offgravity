import { TimeBlockRepository } from '../../domain/repositories/TimeBlockRepository';
import { TimeBlock } from '../../domain/entities/TimeBlock';
import { TimeBlockDTO, TimeBlockDTOMapper } from '../models/TimeBlockDTO';

/**
 * Life OS Dashboard - LocalStorage 기반 TimeBlock 저장소 구현체
 * 
 * [설명]
 * 1. 브라우저의 로컬 스토리지에 시간 계획 데이터를 영속화하는 Data 레이어 모듈입니다.
 * 2. Next.js App Router의 SSR(서버사이드 렌더링) 도중 window 객체가 부재하여 유발될 수 있는
 *    ReferenceError를 차단하기 위해 window 가드를 구현했습니다.
 */
export class LocalStorageTimeBlockRepository implements TimeBlockRepository {
  private readonly STORAGE_KEY = 'life-os-time-blocks';

  /**
   * 로컬 스토리지에 접근 가능한 상태인지 확인하는 가드
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 전체 시간 계획 목록 조회
   */
  public async getTimeBlocks(): Promise<TimeBlock[]> {
    if (!this.isBrowser()) {
      return [];
    }

    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      if (!dataStr) {
        return [];
      }

      const rawList: TimeBlockDTO[] = JSON.parse(dataStr);
      if (!Array.isArray(rawList)) {
        return [];
      }

      // Mapper를 활용하여 DTO를 도메인 엔티티로 매핑 후 반환
      return rawList
        .map((dto) => {
          try {
            return TimeBlockDTOMapper.toEntity(dto);
          } catch (err) {
            console.error('TimeBlock DTO 변환 오류 스킵:', err);
            return null;
          }
        })
        .filter((block): block is TimeBlock => block !== null);
    } catch (error) {
      console.error('LocalStorage 타임블록 조회 에러:', error);
      return [];
    }
  }

  /**
   * 타임블록 저장 (추가 또는 수정)
   */
  public async saveTimeBlock(timeBlock: TimeBlock): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const blocks = await this.getTimeBlocks();
      const updatedDTOs = blocks
        .filter((b) => b.id !== timeBlock.id) // 기존 동일 ID는 제거(업데이트 처리 대비)
        .concat(timeBlock)
        .map((b) => TimeBlockDTOMapper.fromEntity(b));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDTOs));
    } catch (error) {
      console.error('LocalStorage 타임블록 저장 에러:', error);
      throw new Error('일정을 저장하는 도중 오류가 발생했습니다.');
    }
  }

  /**
   * 타임블록 삭제
   */
  public async deleteTimeBlock(id: string): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const blocks = await this.getTimeBlocks();
      const filteredDTOs = blocks
        .filter((b) => b.id !== id)
        .map((b) => TimeBlockDTOMapper.fromEntity(b));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDTOs));
    } catch (error) {
      console.error('LocalStorage 타임블록 삭제 에러:', error);
      throw new Error('일정을 삭제하는 도중 오류가 발생했습니다.');
    }
  }
}
