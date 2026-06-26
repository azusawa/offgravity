'use client';

import { useState, useEffect } from 'react';
import { TargetGoal, GoalPeriod, GoalCategory } from '@/domain/entities/TargetGoal';
import { LocalStorageTargetGoalRepository } from '@/data/repositories/LocalStorageTargetGoalRepository';

// 저장소 단일 인스턴스 생성 (싱글톤 성격으로 인프라 제어)
const repository = new LocalStorageTargetGoalRepository();

/**
 * Life OS Dashboard - 목표 비즈니스 로직 연동용 커스텀 훅
 * 
 * [역할]
 * 1. UI 컴포넌트가 직접 로컬스토리지에 접근하는 것을 막고, repository 인터페이스를 통해 제어합니다.
 * 2. React 상태(goals)를 조회, 생성, 진척도 갱신, 삭제 기능과 결합하여 동기화합니다.
 * 3. Next.js Hydration Mismatch를 방지하기 위해 마운트 완료 이후 데이터를 로드합니다.
 */
export function useTargetGoals() {
  const [goals, setGoals] = useState<TargetGoal[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. 전체 목표 조회 및 상태 갱신 함수
  const fetchGoals = async () => {
    try {
      const data = await repository.getAll();
      setGoals(data);
    } catch (error) {
      console.error('목표 목록 로딩 중 에러 발생:', error);
    }
  };

  // 2. 초기 마운트 시 목표 불러오기 (비동기 린트 가드)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setMounted(true);
      await fetchGoals();
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 3. 신규 목표 추가 함수
  const addGoal = async (title: string, period: GoalPeriod, category: GoalCategory) => {
    try {
      // 랜덤 고유 식별자 생성 (클라이언트 브라우저의 표준 API)
      const randomId = typeof window !== 'undefined' && window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11);

      // 도메인 엔티티 인스턴스 직접 생성 (생성자 레벨에서 유효성 검사 작동)
      const newGoal = new TargetGoal({
        id: randomId,
        title,
        period,
        category,
        progress: 0,
        isCompleted: false,
      });

      await repository.save(newGoal);
      await fetchGoals(); // 상태 갱신
    } catch (error) {
      // 도메인 엔티티의 throw new Error를 감지하여 호출처로 전파
      throw error;
    }
  };

  // 4. 진척도 조절 함수
  const updateGoalProgress = async (id: string, progress: number) => {
    try {
      const found = goals.find((g) => g.id === id);
      if (!found) return;

      // 도메인의 비즈니스 메서드 실행
      found.updateProgress(progress);

      await repository.save(found);
      await fetchGoals();
    } catch (error) {
      console.error('목표 진척도 수정 중 오류 발생:', error);
    }
  };

  // 5. 완료 여부 토글 함수
  const toggleGoalCompletion = async (id: string) => {
    try {
      const found = goals.find((g) => g.id === id);
      if (!found) return;

      // 도메인의 토글 비즈니스 메서드 실행
      found.toggleComplete();

      await repository.save(found);
      await fetchGoals();
    } catch (error) {
      console.error('목표 완료 토글 중 오류 발생:', error);
    }
  };

  // 6. 목표 삭제 함수
  const deleteGoal = async (id: string) => {
    try {
      await repository.delete(id);
      await fetchGoals();
    } catch (error) {
      console.error('목표 삭제 중 오류 발생:', error);
    }
  };

  // 7. 특정 목표에 할 일 추가 함수
  const addTodoToGoal = async (goalId: string, title: string) => {
    try {
      const found = goals.find((g) => g.id === goalId);
      if (!found) return;

      const randomId = typeof window !== 'undefined' && window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11);

      found.addTodo({
        id: randomId,
        title,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });

      await repository.save(found);
      await fetchGoals(); // 상태 갱신
    } catch (error) {
      throw error;
    }
  };

  // 8. 특정 목표의 할 일 완료 토글 함수
  const toggleTodoInGoal = async (goalId: string, todoId: string) => {
    try {
      const found = goals.find((g) => g.id === goalId);
      if (!found) return;

      found.toggleTodo(todoId);

      await repository.save(found);
      await fetchGoals(); // 상태 갱신
    } catch (error) {
      console.error('할 일 완료 토글 중 오류 발생:', error);
    }
  };

  // 9. 특정 목표의 할 일 삭제 함수
  const deleteTodoInGoal = async (goalId: string, todoId: string) => {
    try {
      const found = goals.find((g) => g.id === goalId);
      if (!found) return;

      found.removeTodo(todoId);

      await repository.save(found);
      await fetchGoals(); // 상태 갱신
    } catch (error) {
      console.error('할 일 삭제 중 오류 발생:', error);
    }
  };

  return {
    goals,
    loading,
    mounted,
    addGoal,
    updateGoalProgress,
    toggleGoalCompletion,
    deleteGoal,
    addTodoToGoal,
    toggleTodoInGoal,
    deleteTodoInGoal,
  };
}
