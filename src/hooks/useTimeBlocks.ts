'use client';

import { useState, useEffect, useMemo } from 'react';
import { TimeBlock, TimeBlockCategory } from '../domain/entities/TimeBlock';
import { LocalStorageTimeBlockRepository } from '../data/repositories/LocalStorageTimeBlockRepository';

/**
 * Life OS Dashboard - useTimeBlocks 프레젠테이션 컨트롤러 훅
 * 
 * [설명]
 * 1. UI의 일정 상태와 LocalStorage 영속화 레이어를 연결하는 중재자 역할을 담당합니다.
 * 2. 신규 등록 시 기존 일과와의 '시간대 중복 검사(Overlap Check)'를 수행하여 겹칠 시 예외를 송출합니다.
 * 3. React 19 ESLint Cascading Render 방지를 위해 마운트 비동기화를 적용했습니다.
 */
export function useTimeBlocks() {
  const repository = useMemo(() => new LocalStorageTimeBlockRepository(), []);
  
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // 로컬저장소 데이터 초기 수집
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const list = await repository.getTimeBlocks();
        // 시작 시간 순으로 정렬하여 전달
        const sortedList = [...list].sort((a, b) => a.rawStartTime - b.rawStartTime);
        setTimeBlocks(sortedList);
      } catch (err) {
        console.error('시간 블록 로드 에러:', err);
      } finally {
        // 비동기 묶음 처리로 cascading renders ESLint 경고 완벽 차단
        setTimeout(() => {
          setMounted(true);
          setLoading(false);
        }, 0);
      }
    };
    
    fetchBlocks();
  }, [repository]);

  /**
   * 신규 일정 블록 추가
   * @throws {Error} 시간 중복 또는 유효성 실패 시 한글 메시지 예외 방출
   */
  const addTimeBlock = async (
    title: string,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    category: TimeBlockCategory
  ): Promise<void> => {
    const newId = typeof window !== 'undefined' ? crypto.randomUUID() : Math.random().toString();
    
    // 1. 임시 인스턴스를 생성해 도메인 내부 제약 검사 선제 수행
    const pendingBlock = new TimeBlock({
      id: newId,
      title,
      startHour,
      startMinute,
      endHour,
      endMinute,
      category
    });

    // 2. 시간대 중복(Overlap) 검출 비즈니스 룰 적용
    const newStartTotal = startHour * 60 + startMinute;
    const newEndTotal = endHour * 60 + endMinute;

    const isOverlap = timeBlocks.some((existing) => {
      const existStartTotal = existing.startHour * 60 + existing.startMinute;
      const existEndTotal = existing.endHour * 60 + existing.endMinute;
      // 시작1 < 종료2 && 종료1 > 시작2 일 때 겹침 성립
      return newStartTotal < existEndTotal && newEndTotal > existStartTotal;
    });

    if (isOverlap) {
      throw new Error('선택하신 시간대에 이미 겹치는 일정이 존재합니다.');
    }

    // 3. 로컬 저장소 영속화 진행 및 훅 상태 동기화
    await repository.saveTimeBlock(pendingBlock);
    
    setTimeBlocks((prev) => {
      const nextList = [...prev, pendingBlock];
      return nextList.sort((a, b) => a.rawStartTime - b.rawStartTime);
    });
  };

  /**
   * 지정한 ID의 일정 블록 삭제
   */
  const deleteTimeBlock = async (id: string): Promise<void> => {
    await repository.deleteTimeBlock(id);
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    timeBlocks,
    loading,
    mounted,
    addTimeBlock,
    deleteTimeBlock
  };
}
