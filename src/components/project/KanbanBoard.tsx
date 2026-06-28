'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
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
 * HTML5 표준 Drag & Drop 기능을 지원하여 마우스 끌기로 즉각적인 상태 전환 및 진척도 자동 조정을 연동합니다.
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

  // 드래그 중 실시간 재배치 순서를 보관할 임시 상태
  const [tempTasks, setTempTasks] = useState<ProjectTask[] | null>(null);

  // 최종 렌더링과 위치 계산에 이용할 태스크 배열
  const displayTasks = tempTasks || tasks;

  // FLIP 애니메이션용: 드롭 직전 카드들의 뷰포트 Y축 위치 보관
  const prevPositionsRef = useRef<Record<string, number>>({});

  // 모든 작업 카드 엘리먼트들의 현재 Y 위치를 캡처하여 저장
  const recordPositions = () => {
    const positions: Record<string, number> = {};
    displayTasks.forEach((task) => {
      const el = document.querySelector(`[data-task-id="${task.id}"]`);
      if (el) {
        positions[task.id] = el.getBoundingClientRect().top;
      }
    });
    prevPositionsRef.current = positions;
  };

  // FLIP 기법 레이아웃 트랜지션 애니메이션 실행
  useLayoutEffect(() => {
    if (Object.keys(prevPositionsRef.current).length === 0) return;

    displayTasks.forEach((task) => {
      // 드래그 중인 원본 카드는 높이가 0이고 보이지 않으므로 FLIP 애니메이션 대상에서 제외
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

    prevPositionsRef.current = {};
  }, [displayTasks, draggedTaskId]);

  // 컬럼별 마우스 드래그 오버(dragOver) 시각 효과 상태
  const [dragOverCol, setDragOverCol] = useState<Record<string, boolean>>({});

  // --- [HTML5 Drag & Drop 이벤트 핸들러] ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    // 브라우저가 드래그 이미지(Ghost Image) 캡처를 안전하게 완료한 후 갱신
    setTimeout(() => {
      setDraggedTaskId(id);
      setTempTasks([...tasks]); // 드래그 중인 임시 태스크 배열 초기화
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setTempTasks(null);
  };

  const handleDragEnter = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(prev => ({ ...prev, [status]: true }));
  };

  const handleDragLeave = (status: TaskStatus) => {
    setDragOverCol(prev => ({ ...prev, [status]: false }));
  };

  // 컬럼 전체 기준 드래그 오버 (Jira 방식: 정적 카드의 절대 좌표로 삽입 인덱스 판별)
  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId || !tempTasks) return;

    // 해당 컬럼에 위치한 다른 정적(드래그 중이지 않은) 카드 엘리먼트들만 조회
    const staticCardElements = Array.from(
      document.querySelectorAll(`[data-task-status="${status}"]:not([data-task-id="${draggedTaskId}"])`)
    ) as HTMLElement[];

    const mouseY = e.clientY;
    let insertIndexInCol = staticCardElements.length; // 기본값은 컬럼의 맨 뒤

    // 각 정적 카드의 수직 중앙(Y) 값을 기준으로 마우스가 위인지 아래인지 판별
    for (let i = 0; i < staticCardElements.length; i++) {
      const el = staticCardElements[i];
      const rect = el.getBoundingClientRect();
      const cardCenterY = rect.top + rect.height / 2;

      if (mouseY < cardCenterY) {
        insertIndexInCol = i;
        break;
      }
    }

    // draggedTaskId를 제외한 정적 태스크 배열
    const currentTemp = tempTasks.filter((t) => t.id !== draggedTaskId);

    // 해당 컬럼에 존재하는 정적 태스크들 필터링
    const colStaticTasks = currentTemp.filter((t) => t.status === status);
    
    let globalInsertIndex = currentTemp.length; // 기본값: 전체 배열의 맨 뒤

    if (insertIndexInCol < colStaticTasks.length) {
      const targetTask = colStaticTasks[insertIndexInCol];
      globalInsertIndex = currentTemp.findIndex((t) => t.id === targetTask.id);
    } else {
      // 해당 컬럼의 맨 마지막 카드 뒤에 위치
      if (colStaticTasks.length > 0) {
        const lastTask = colStaticTasks[colStaticTasks.length - 1];
        globalInsertIndex = currentTemp.findIndex((t) => t.id === lastTask.id) + 1;
      }
    }

    const draggedTask = tempTasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    // 컬럼 상태(status) 업데이트 및 진척도 동기화
    if (draggedTask.status !== status) {
      draggedTask.updateStatus(status);
    }

    const testTasks = [...currentTemp];
    testTasks.splice(globalInsertIndex, 0, draggedTask);

    const isSameOrder = tempTasks.every((t, idx) => t.id === testTasks[idx]?.id);
    if (!isSameOrder) {
      recordPositions(); // FLIP 위치 기록
      setTempTasks(testTasks);
    }
  };

  // 최종 드롭 시 저장
  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(prev => ({ ...prev, [status]: false }));

    if (tempTasks) {
      recordPositions(); // FLIP: 드롭 직전 위치 캡처
      await reorderTasks(tempTasks);
    }
    handleDragEnd();
  };

  // 편집 다이얼로그 활성화
  const openEditModal = (task: ProjectTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setErrorMsg('');
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
        const colTasks = displayTasks.filter((t) => t.status === col.status);
        const isOver = dragOverCol[col.status];

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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-450 dark:text-zinc-400">
                {colTasks.length}
              </span>
            </div>

            {/* 개별 작업 카드 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto max-h-[620px] pr-1">
              {colTasks.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-400/80 border border-dashed border-zinc-500/10 rounded-lg">
                  {t('target.noGoals')}
                </div>
              ) : (
                colTasks.map((task) => {
                  // 드래그 중인 원래 위치는 파란색 가이드 플레이스홀더로 렌더링하여
                  // 공간이 벌어질 자리를 알기 쉽게 함
                  if (task.id === draggedTaskId) {
                    return (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        data-task-status={task.status}
                        className="rounded-xl border-2 border-dashed border-blue-500/35 bg-blue-500/[0.015] min-h-[140px] mb-2.5 transition-all duration-200"
                        title={task.title}
                      />
                    );
                  }

                  const cardStyle = {
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  };

                  return (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      data-task-status={task.status}
                      draggable
                      style={cardStyle}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => openEditModal(task)}
                      className="group glass-panel p-4 flex flex-col justify-between min-h-[140px] cursor-grab active:cursor-grabbing hover:scale-[1.015] duration-200 shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] mb-2.5 transition-transform"
                    >
                      <div>
                        {/* 작업명 및 호버 퀵 액션 */}
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-150 leading-snug group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                            {task.title}
                          </h4>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity duration-200">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1 rounded text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-500/10 transition-colors cursor-pointer border border-transparent"
                              title={t('project.editTask')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 rounded text-zinc-450 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer border border-transparent"
                              title={t('project.deleteTask')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 작업 설명 */}
                        {task.description && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-zinc-500/10 pt-2.5">
                        {/* 기간 표시 */}
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-400 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>{task.startDate}</span>
                          <span>~</span>
                          <span>{task.endDate}</span>
                        </div>

                        {/* 진척도 수동 조율 */}
                        <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-450 dark:text-zinc-400 font-mono">
                          <span className="font-semibold">{t('project.progress')}</span>
                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value, 10))}
                              className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
                            />
                            <span className="w-7 text-right">{task.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
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
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-500/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer flex items-center justify-center border border-transparent"
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
