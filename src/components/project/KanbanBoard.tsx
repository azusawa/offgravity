'use client';

/* eslint-disable react-hooks/refs */

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProjectTask, TaskStatus } from '@/domain/entities/ProjectTask';
import { useTranslation } from '@/hooks/useTranslation';
import { Trash2, Edit2, Calendar, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';

interface KanbanBoardProps {
  tasks: ProjectTask[];
  updateTaskProgress: (id: string, progress: number) => Promise<void>;
  updateTaskInfo: (id: string, title: string, description: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (reorderedTasks: ProjectTask[]) => Promise<void>;
}

/**
 * Life OS Dashboard - KanbanBoard 컴포넌트
 * 
 * [설명]
 * 프로젝트 태스크의 상태에 따라 To Do, In Progress, Done의 3열 보드로 시각화합니다.
 * 카드와 카드 사이로 커서가 위치하면 공간이 스무스하게 벌어지는 가상 플레이스홀더와 
 * 브라우저 밖 이탈 드롭 시 무결한 복구를 지원합니다.
 */
export default function KanbanBoard({
  tasks,
  updateTaskProgress,
  updateTaskInfo,
  deleteTask,
  reorderTasks,
}: KanbanBoardProps) {
  const { t } = useTranslation();
  
  // 개별 편집 모달 제어 상태
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 현재 드래그 중인 카드 ID 상태
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // 드래그 중 실시간 플레이스홀더 가이드 위치 정보
  const [placeholderInfo, setPlaceholderInfo] = useState<{ status: TaskStatus; index: number } | null>(null);

  // 진짜 카드 DND 세션 노드 존속용 최초 출발지 상태
  const draggedStartStatusRef = useRef<TaskStatus | null>(null);

  // FLIP 애니메이션용: 드롭 직전 카드들의 Y축 위치 보관
  const prevPositionsRef = useRef<Record<string, number>>({});

  // 드래그 시작 지연 캡처용 타이머 레퍼런스
  const dragStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모든 작업 카드 엘리먼트들의 현재 Y 위치를 캡처하여 저장 (가상 플레이스홀더 포함)
  const recordPositions = () => {
    const positions: Record<string, number> = {};
    tasks.forEach((task) => {
      const el = document.querySelector(`[data-task-id="${task.id}"]`);
      if (el) {
        positions[task.id] = el.getBoundingClientRect().top;
      }
    });
    // 가상 플레이스홀더 돔 노드 위치도 함께 추적
    if (draggedTaskId) {
      const phEl = document.querySelector(`[data-task-id="placeholder-${draggedTaskId}"]`);
      if (phEl) {
        positions[`placeholder-${draggedTaskId}`] = phEl.getBoundingClientRect().top;
      }
    }
    prevPositionsRef.current = positions;
  };

  // FLIP 기법 레이아웃 트랜지션 애니메이션 실행
  useLayoutEffect(() => {
    if (Object.keys(prevPositionsRef.current).length === 0) return;

    tasks.forEach((task) => {
      // 드래그 중인 진짜 원본 카드는 숨겨져 있으므로 애니메이션 대상에서 제외
      if (task.id === draggedTaskId) return;

      const el = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
      if (!el) return;

      const prevTop = prevPositionsRef.current[task.id];
      if (prevTop === undefined) return;

      const currentTop = el.getBoundingClientRect().top;
      const deltaY = prevTop - currentTop;

      if (deltaY !== 0) {
        // Invert: 즉시 이전 위치로 돔 이동
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.transition = 'none';

        // Play: 다음 프레임에 원래 0px로 300ms 트랜지션
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
          el.style.transform = 'translateY(0px)';
        });

        // 300ms 후 인라인 스타일 복구
        setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
        }, 300);
      }
    });

    // 가상 플레이스홀더 돔 노드의 트랜지션 처리
    if (draggedTaskId) {
      const phEl = document.querySelector(`[data-task-id="placeholder-${draggedTaskId}"]`) as HTMLElement;
      if (phEl) {
        const prevTop = prevPositionsRef.current[`placeholder-${draggedTaskId}`];
        if (prevTop !== undefined) {
          const currentTop = phEl.getBoundingClientRect().top;
          const deltaY = prevTop - currentTop;
          if (deltaY !== 0) {
            phEl.style.transform = `translateY(${deltaY}px)`;
            phEl.style.transition = 'none';
            requestAnimationFrame(() => {
              phEl.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
              phEl.style.transform = 'translateY(0px)';
            });
            setTimeout(() => {
              phEl.style.transition = '';
              phEl.style.transform = '';
            }, 300);
          }
        }
      }
    }

    prevPositionsRef.current = {};
  }, [placeholderInfo, tasks, draggedTaskId]);

  // 컬럼별 마우스 드래그 오버(dragOver) 시각 효과 상태
  const [dragOverCol, setDragOverCol] = useState<Record<string, boolean>>({});

  // Plain Object와 도메인 인스턴스 양측 모두 무결하게 호환 가능한 복제 헬퍼
  const cloneTask = (t: ProjectTask): ProjectTask => {
    if (typeof t.clone === 'function') {
      return t.clone();
    }
    return new ProjectTask({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      progress: t.progress,
      createdAt: t.createdAt,
      type: t.type,
      parentId: t.parentId,
    });
  };

  const handleDragEnd = () => {
    if (dragStartTimerRef.current) {
      clearTimeout(dragStartTimerRef.current);
      dragStartTimerRef.current = null;
    }
    setDraggedTaskId(null);
    setPlaceholderInfo(null);
    draggedStartStatusRef.current = null;
  };

  // --- [HTML5 Drag & Drop 이벤트 핸들러] ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';

    if (dragStartTimerRef.current) {
      clearTimeout(dragStartTimerRef.current);
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      draggedStartStatusRef.current = task.status;
    }

    // 브라우저가 드래그 이미지(Ghost Image) 캡처를 안전하게 완료한 후 갱신
    dragStartTimerRef.current = setTimeout(() => {
      setDraggedTaskId(id);
      dragStartTimerRef.current = null;
    }, 0);
  };

  // 브라우저 DND 이벤트 누락 및 외부 드래그 취소 대응 전역 mouseup/dragend 안전핀
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (draggedTaskId) {
        handleDragEnd();
      }
    };

    if (draggedTaskId) {
      window.addEventListener('mouseup', handleGlobalDragEnd);
      window.addEventListener('dragend', handleGlobalDragEnd);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalDragEnd);
      window.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [draggedTaskId]);

  const handleDragEnter = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(prev => ({ ...prev, [status]: true }));
  };

  const handleDragLeave = (status: TaskStatus) => {
    setDragOverCol(prev => ({ ...prev, [status]: false }));
  };

  // 컬럼 전체 기준 드래그 오버 (가이드 박스를 제외한 정적 카드의 Y좌표 중앙값으로 인덱스 판별)
  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // 해당 컬럼에 위치한 다른 정적 카드 엘리먼트들만 조회 (원본 드래그 카드 및 플레이스홀더 제외)
    const staticCardElements = Array.from(
      document.querySelectorAll(`[data-task-status="${status}"]:not([data-task-id="${draggedTaskId}"]):not([data-task-id^="placeholder-"])`)
    ) as HTMLElement[];

    const mouseY = e.clientY;
    let insertIndex = staticCardElements.length; // 기본값은 컬럼의 맨 뒤

    for (let i = 0; i < staticCardElements.length; i++) {
      const el = staticCardElements[i];
      const rect = el.getBoundingClientRect();
      const cardCenterY = rect.top + rect.height / 2;

      if (mouseY < cardCenterY) {
        insertIndex = i;
        break;
      }
    }

    if (!placeholderInfo || placeholderInfo.status !== status || placeholderInfo.index !== insertIndex) {
      recordPositions(); // FLIP을 통한 스무스한 애니메이션 확보
      setPlaceholderInfo({ status, index: insertIndex });
    }
  };

  // 최종 드롭 시 저장
  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(prev => ({ ...prev, [status]: false }));

    if (draggedTaskId && placeholderInfo) {
      const currentTemp = tasks.filter((t) => t.id !== draggedTaskId);
      const targetColTasks = currentTemp.filter((t) => t.status === placeholderInfo.status);
      
      let globalInsertIndex = currentTemp.length;
      if (placeholderInfo.index < targetColTasks.length) {
        const targetTask = targetColTasks[placeholderInfo.index];
        globalInsertIndex = currentTemp.findIndex((t) => t.id === targetTask.id);
      } else {
        if (targetColTasks.length > 0) {
          const lastTask = targetColTasks[targetColTasks.length - 1];
          globalInsertIndex = currentTemp.findIndex((t) => t.id === lastTask.id) + 1;
        }
      }

      const draggedTask = tasks.find((t) => t.id === draggedTaskId);
      if (draggedTask) {
        const cloned = cloneTask(draggedTask);
        cloned.updateStatus(placeholderInfo.status); // 타겟 컬럼 상태 동기화

        const finalTasks = [...currentTemp];
        finalTasks.splice(globalInsertIndex, 0, cloned);

        recordPositions(); // FLIP
        await reorderTasks(finalTasks);
      }
    }
    handleDragEnd();
  };

  // 편집 처리
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setErrorMsg('');

    if (!editTitle.trim()) {
      setErrorMsg(t('target.titleRequired'));
      return;
    }

    try {
      await updateTaskInfo(editingTask.id, editTitle, editDesc);
      setEditingTask(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('project.dateDiffError'));
      }
    }
  };

  // 태스크 제거 핸들러
  const handleDeleteTask = async (id: string) => {
    if (confirm(t('project.confirmDelete'))) {
      await deleteTask(id);
      if (editingTask?.id === id) {
        setEditingTask(null);
      }
    }
  };

  // 편집 다이얼로그 활성화
  const openEditModal = (task: ProjectTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setErrorMsg('');
  };

  // 3대 컬럼 선언 명세서
  const columns: { status: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
    { 
      status: 'todo', 
      title: t('project.todo'), 
      color: 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-500/5', 
      icon: <Circle className="w-4 h-4 text-zinc-400" /> 
    },
    { 
      status: 'in_progress', 
      title: t('project.inProgress'), 
      color: 'border-blue-200/50 dark:border-blue-900/30 bg-blue-500/5', 
      icon: <AlertCircle className="w-4 h-4 text-blue-500" /> 
    },
    { 
      status: 'done', 
      title: t('project.done'), 
      color: 'border-emerald-200/40 dark:border-emerald-900/20 bg-emerald-500/5', 
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none font-sans">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isOver = dragOverCol[col.status];

        // DND 세션 보존용: 출발 컬럼인지 여부 확인
        const isStartCol = draggedStartStatusRef.current === col.status;
        const colStaticTasks = colTasks.filter(t => t.id !== draggedTaskId);

        // 실시간 가상 플레이스홀더 삽입 여부 판별
        const hasPlaceholderHere = placeholderInfo && placeholderInfo.status === col.status;
        const placeholderIndex = hasPlaceholderHere ? placeholderInfo.index : -1;

        const colRenderList: (ProjectTask | { id: string; isPlaceholder: true; status: TaskStatus })[] = [];

        colStaticTasks.forEach((task, idx) => {
          if (hasPlaceholderHere && idx === placeholderIndex) {
            colRenderList.push({
              id: `placeholder-${draggedTaskId}`,
              isPlaceholder: true,
              status: col.status
            });
          }
          colRenderList.push(task);
        });

        if (hasPlaceholderHere && placeholderIndex >= colStaticTasks.length) {
          colRenderList.push({
            id: `placeholder-${draggedTaskId}`,
            isPlaceholder: true,
            status: col.status
          });
        }

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleColumnDragOver(e, col.status)}
            onDragEnter={(e) => handleDragEnter(e, col.status)}
            onDragLeave={() => handleDragLeave(col.status)}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex flex-col min-h-[520px] rounded-xl border p-4 transition-all duration-300 ${col.color} ${
              isOver 
                ? 'scale-[1.01] border-zinc-400 dark:border-zinc-650 bg-zinc-500/10' 
                : ''
            }`}
          >
            {/* 컬럼 정보 탑바 */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/10">
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  {col.title}
                </span>
              </div>
              {/* 화면상 렌더링된 실질 카드 개수 요약 */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-450 dark:text-zinc-400">
                {colStaticTasks.length + (hasPlaceholderHere ? 1 : 0)}
              </span>
            </div>

            {/* 개별 작업 카드 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto max-h-[620px] pr-1">
              {colRenderList.length === 0 && !isStartCol ? (
                <div className="py-16 text-center text-xs text-zinc-400/80 border border-dashed border-zinc-500/10 rounded-lg">
                  {t('target.noGoals')}
                </div>
              ) : (
                <>
                  {colRenderList.map((item) => {
                    if ('isPlaceholder' in item) {
                      return (
                        <div
                          key={item.id}
                          data-task-id={item.id}
                          data-task-status={item.status}
                          className="rounded-xl border-2 border-dashed border-blue-500/35 bg-blue-500/[0.015] min-h-[140px] mb-2.5 transition-all duration-200 animate-fade-in"
                        />
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        data-task-id={item.id}
                        data-task-status={item.status}
                        draggable
                        style={{
                          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        }}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        onDoubleClick={() => openEditModal(item)}
                        className="group glass-panel p-4 flex flex-col justify-between min-h-[140px] cursor-grab active:cursor-grabbing hover:scale-[1.015] duration-200 shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] mb-2.5 transition-transform"
                      >
                        <div>
                          {/* 작업명 및 호버 퀵 액션 */}
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-150 leading-snug group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                              {item.title}
                            </h4>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity duration-200">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(item);
                                }}
                                className="p-1 rounded text-zinc-455 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-500/10 transition-colors cursor-pointer border border-transparent"
                                title={t('project.editTask')}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(item.id);
                                }}
                                className="p-1 rounded text-zinc-455 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer border border-transparent"
                                title={t('project.deleteTask')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 작업 설명 */}
                          {item.description && (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 border-t border-zinc-500/10 pt-2.5">
                          {/* 기간 표시 */}
                          {item.startDate && item.endDate && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-400 font-mono">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              <span>{item.startDate}</span>
                              <span>~</span>
                              <span>{item.endDate}</span>
                            </div>
                          )}

                          {/* 진척도 수동 조율 */}
                          {item.type !== 'group' && (
                            <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-455 dark:text-zinc-400 font-mono">
                              <span className="font-semibold">{t('project.progress')}</span>
                              <div className="flex-1 flex items-center gap-1.5">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={item.progress}
                                  onChange={(e) => updateTaskProgress(item.id, parseInt(e.target.value, 10))}
                                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
                                />
                                <span className="w-7 text-right">{item.progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 출발지 보드 아래에 진짜 원본 카드 돔 노드를 display: none 상태로 안전 보관 (DND 캡처 추적용) */}
                  {isStartCol && draggedTaskId && (() => {
                    const draggedTask = tasks.find(t => t.id === draggedTaskId);
                    if (!draggedTask) return null;
                    return (
                      <div
                        key={draggedTask.id}
                        data-task-id={draggedTask.id}
                        data-task-status={draggedTask.status}
                        draggable
                        style={{ display: 'none' }}
                        onDragStart={(e) => handleDragStart(e, draggedTask.id)}
                        onDragEnd={handleDragEnd}
                        className="hidden"
                      />
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* 태스크 개별 편집 모달 다이얼로그 */}
      {editingTask && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 bg-opacity-95 dark:bg-opacity-95 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-500/10 text-zinc-455 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer flex items-center justify-center border border-transparent"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
              {t('project.editTask')}
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.taskTitle')}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.taskDesc')}</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 h-24 resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('project.deleteTask')}</span>
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 text-zinc-650 dark:text-zinc-350 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    {t('calendar.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
                  >
                    {t('project.submitEdit')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
