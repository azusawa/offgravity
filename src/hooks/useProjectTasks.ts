'use client';

import { useState, useEffect } from 'react';
import { ProjectTask, TaskStatus, TaskType } from '@/domain/entities/ProjectTask';
import { LocalStorageProjectTaskRepository } from '@/data/repositories/LocalStorageProjectTaskRepository';
import { ProjectTaskTreeService } from '@/domain/services/ProjectTaskTreeService';

const repository = new LocalStorageProjectTaskRepository();

/**
 * Life OS Dashboard - 프로젝트 태스크 비즈니스 로직용 커스텀 훅
 * 
 * [역할]
 * UI 컴포넌트가 직접 저장소에 접근하는 것을 막고 Repository를 통해 데이터를 조작하며,
 * React 상태 갱신 및 비즈니스 예외(Validation) 전파를 제어합니다.
 * 추가적으로, 계층형 트리 정렬과 날짜/진척도 자동 집계를 연결합니다.
 */
export function useProjectTasks() {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. 전체 태스크 로드 함수 (트리 집계 연산 및 Pre-order 1차원 전개 동기화)
  const fetchTasks = async () => {
    try {
      const data = await repository.getAll();
      const tree = ProjectTaskTreeService.buildTree(data);
      const calculatedFlatTasks = ProjectTaskTreeService.flattenTree(tree);
      setTasks(calculatedFlatTasks);
    } catch (error) {
      console.error('프로젝트 태스크 조회 실패:', error);
    }
  };

  // 2. 초기 마운트 시 데이터 조회 (비동기 린트 가드)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setMounted(true);
      await fetchTasks();
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 3. 신규 태스크 추가 함수
  const addTask = async (params: {
    title: string;
    description?: string;
    status?: TaskStatus;
    startDate: string;
    endDate: string;
    progress?: number;
    type?: TaskType;
    parentId?: string | null;
  }) => {
    try {
      const randomId = typeof window !== 'undefined' && window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11);

      // 도메인 생성자 검증 로직 가동
      const newTask = new ProjectTask({
        id: randomId,
        title: params.title,
        description: params.description,
        status: params.status ?? 'todo',
        startDate: params.startDate,
        endDate: params.endDate,
        progress: params.progress ?? 0,
        type: params.type ?? 'task',
        parentId: params.parentId ?? null,
      });

      await repository.save(newTask);
      await fetchTasks(); // 상태 갱신 (트리 계산 및 정렬 반영)
    } catch (error) {
      throw error;
    }
  };

  // 4. 상태 변경 함수 (status ➡️ progress 동시 보정)
  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      const found = tasks.find((t) => t.id === id);
      if (!found) return;

      found.updateStatus(status);
      await repository.save(found);
      await fetchTasks(); // 상태 갱신
    } catch (error) {
      console.error('태스크 상태 수정 실패:', error);
    }
  };

  // 5. 날짜 변경 함수
  const updateTaskDates = async (id: string, start: string, end: string) => {
    try {
      const found = tasks.find((t) => t.id === id);
      if (!found) return;

      found.updateDates(start, end);
      await repository.save(found);
      await fetchTasks(); // 상태 갱신
    } catch (error) {
      console.error('태스크 날짜 수정 실패:', error);
      throw error;
    }
  };

  // 6. 진척도 변경 함수 (progress ➡️ status 동시 보정)
  const updateTaskProgress = async (id: string, progress: number) => {
    try {
      const found = tasks.find((t) => t.id === id);
      if (!found) return;

      found.updateProgress(progress);
      await repository.save(found);
      await fetchTasks(); // 상태 갱신
    } catch (error) {
      console.error('태스크 진척도 수정 실패:', error);
    }
  };

  // 7. 기본 정보 수정 함수
  const updateTaskInfo = async (id: string, title: string, description: string) => {
    try {
      const found = tasks.find((t) => t.id === id);
      if (!found) return;

      found.updateInfo(title, description);
      await repository.save(found);
      await fetchTasks(); // 상태 갱신
    } catch (error) {
      throw error;
    }
  };

  // 8. 태스크 삭제 함수
  const deleteTask = async (id: string) => {
    try {
      await repository.delete(id);
      await fetchTasks(); // 상태 갱신
    } catch (error) {
      console.error('태스크 삭제 실패:', error);
    }
  };

  // 9. 태스크 순서 변경 및 영구 저장 함수
  const reorderTasks = async (reorderedTasks: ProjectTask[]) => {
    try {
      setTasks(reorderedTasks);
      await repository.saveAll(reorderedTasks);
    } catch (error) {
      console.error('태스크 순서 재정렬 실패:', error);
    }
  };

  return {
    tasks,
    loading,
    mounted,
    addTask,
    updateTaskStatus,
    updateTaskDates,
    updateTaskProgress,
    updateTaskInfo,
    deleteTask,
    reorderTasks,
  };
}
