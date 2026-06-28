'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ProjectTask } from '@/domain/entities/ProjectTask';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GanttChartProps {
  tasks: ProjectTask[];
  updateTaskDates: (id: string, start: string, end: string) => Promise<void>;
  reorderTasks: (reorderedTasks: ProjectTask[]) => Promise<void>;
}

/**
 * Life OS Dashboard - GanttChart 컴포넌트
 * 
 * [설명]
 * 프로젝트 태스크의 마감일과 일정을 아름다운 가로형 타임라인 막대(Bar) 그리드로 시각화합니다.
 * 외부 PM 라이브러리 없이 순수 리액트 마우스 이벤트 제어로 간트 바 본체 드래그(시작/마감일 평행 이동)
 * 및 바 우측 리사이즈 핸들 드래그(마감 마일스톤 날짜 연장/축소) 인터랙티브 기능을 구현했습니다.
 */
export default function GanttChart({
  tasks,
  updateTaskDates,
  reorderTasks,
}: GanttChartProps) {
  const { t } = useTranslation();

  // 드래그 중 실시간 재배치 순서를 보관할 임시 상태 (순서 이동용)
  const [tempTasks, setTempTasks] = useState<ProjectTask[] | null>(null);

  // 현재 드래그 중인 리스트 아이템 ID 상태
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // 최종 렌더링과 위치 계산에 이용할 태스크 배열
  const displayTasks = tempTasks || tasks;

  // FLIP 애니메이션용: 드롭 직전 아이템들의 뷰포트 Y축 위치 보관
  const prevPositionsRef = useRef<Record<string, number>>({});

  // 드래그 시작 지연 캡처용 타이머 레퍼런스
  const dragStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모든 좌측 리스트 아이템들의 현재 Y 위치를 캡처하여 저장
  const recordPositions = () => {
    const positions: Record<string, number> = {};
    displayTasks.forEach((task) => {
      const el = document.querySelector(`[data-list-id="${task.id}"]`);
      if (el) {
        positions[task.id] = el.getBoundingClientRect().top;
      }
    });
    prevPositionsRef.current = positions;
  };

  // FLIP 기법 레이아웃 트랜지션 애니메이션 실행 (좌측 리스트용)
  useLayoutEffect(() => {
    if (Object.keys(prevPositionsRef.current).length === 0) return;

    displayTasks.forEach((task) => {
      if (task.id === draggedTaskId) return;

      const el = document.querySelector(`[data-list-id="${task.id}"]`) as HTMLElement;
      if (!el) return;

      const prevTop = prevPositionsRef.current[task.id];
      if (prevTop === undefined) return;

      const currentTop = el.getBoundingClientRect().top;
      const deltaY = prevTop - currentTop;

      if (deltaY !== 0) {
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.transition = 'none';

        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
          el.style.transform = 'translateY(0px)';
        });

        setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
        }, 300);
      }
    });

    prevPositionsRef.current = {};
  }, [displayTasks, draggedTaskId]);

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
    });
  };

  const handleListDragEnd = () => {
    if (dragStartTimerRef.current) {
      clearTimeout(dragStartTimerRef.current);
      dragStartTimerRef.current = null;
    }
    setDraggedTaskId(null);
    setTempTasks(null);
  };

  // --- [좌측 리스트 순서 드래그 앤 드롭 핸들러] ---
  const handleListDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';

    if (dragStartTimerRef.current) {
      clearTimeout(dragStartTimerRef.current);
    }
    
    // 브라우저 캡처 후 상태 갱신
    dragStartTimerRef.current = setTimeout(() => {
      setDraggedTaskId(id);
      setTempTasks(tasks.map(t => cloneTask(t)));
      dragStartTimerRef.current = null;
    }, 0);
  };

  // 브라우저 DND 이벤트 누락 및 외부 드래그 취소 대응 전역 mouseup/dragend 안전핀 (리스트 DND용)
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (draggedTaskId) {
        handleListDragEnd();
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

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTaskId || !tempTasks) return;

    // 좌측 리스트 내 다른 정적 아이템들 조회
    const staticElements = Array.from(
      document.querySelectorAll(`[data-list-status="static"]:not([data-list-id="${draggedTaskId}"])`)
    ) as HTMLElement[];

    const mouseY = e.clientY;
    let insertIndex = staticElements.length; // 기본값: 맨 뒤

    for (let i = 0; i < staticElements.length; i++) {
      const el = staticElements[i];
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      if (mouseY < centerY) {
        insertIndex = i;
        break;
      }
    }

    // 드래그 대상을 제외한 정적 리스트
    const currentTemp = tempTasks.filter((t) => t.id !== draggedTaskId);

    // 타겟 위치에 드래그 카드를 삽입
    const draggedTask = tempTasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    const testTasks = [...currentTemp];
    testTasks.splice(insertIndex, 0, draggedTask);

    const isSameOrder = tempTasks.every((t, idx) => t.id === testTasks[idx]?.id);
    if (!isSameOrder) {
      recordPositions(); // FLIP 위치 기록
      setTempTasks(testTasks);
    }
  };

  const handleListDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (tempTasks) {
      recordPositions();
      await reorderTasks(tempTasks);
    }
    handleListDragEnd();
  };
  
  // --- [날짜 연산 유틸리티 함수] ---
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getDiffDays = (d1: Date, d2: Date): number => {
    const diffTime = d1.getTime() - d2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDate = (str: string): Date => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // 간트 타임라인의 중심이 되는 기준 날짜 (기본값: 오늘)
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());
  
  // 타임라인에 렌더링할 전체 일수 (3주일 분량)
  const totalDays = 21;
  
  // 그리드 첫 날 설정 (기준일로부터 4일 전으로 잡아 오늘 시점이 중앙-좌측 부근에 오도록 조정)
  const gridStartDate = addDays(baseDate, -4);

  // 21일간의 날짜 배열 생성
  const timelineDates: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    timelineDates.push(addDays(gridStartDate, i));
  }

  // 타임라인 네비게이션 액션
  const goPrev = () => setBaseDate(prev => addDays(prev, -7));
  const goNext = () => setBaseDate(prev => addDays(prev, 7));
  const goToday = () => setBaseDate(new Date());

  // 마우스 실시간 드래그 상태
  const [dragState, setDragState] = useState<{
    taskId: string;
    mode: 'move' | 'resize';
    startX: number;
    originalStart: string;
    originalEnd: string;
    lastDaysOffset: number;
  } | null>(null);

  // 캘린더 그리드 한 칸(하루)의 가로폭 (px)
  const cellWidth = 36;

  // 마우스 다운 핸들러
  const handleDragStart = (
    e: React.MouseEvent, 
    taskId: string, 
    mode: 'move' | 'resize', 
    originalStart: string, 
    originalEnd: string
  ) => {
    e.preventDefault();
    setDragState({
      taskId,
      mode,
      startX: e.clientX,
      originalStart,
      originalEnd,
      lastDaysOffset: 0,
    });
  };

  // 전역 마우스 무브 및 마우스 업 캡처 효과
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const daysOffset = Math.round(deltaX / cellWidth);
      
      if (daysOffset !== dragState.lastDaysOffset) {
        setDragState(prev => prev ? { ...prev, lastDaysOffset: daysOffset } : null);
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const daysOffset = Math.round(deltaX / cellWidth);
      
      const { taskId, mode, originalStart, originalEnd } = dragState;
      setDragState(null); // 드래그 상태 즉시 종료

      if (daysOffset === 0) return;

      try {
        const startD = parseDate(originalStart);
        const endD = parseDate(originalEnd);
        
        let newStart = originalStart;
        let newEnd = originalEnd;

        if (mode === 'move') {
          newStart = formatDate(addDays(startD, daysOffset));
          newEnd = formatDate(addDays(endD, daysOffset));
        } else if (mode === 'resize') {
          const targetEnd = addDays(endD, daysOffset);
          if (targetEnd < startD) {
            // 마감 마일스톤이 시작일보다 앞으로 갈 수 없도록 가드
            return;
          }
          newEnd = formatDate(targetEnd);
        }

        await updateTaskDates(taskId, newStart, newEnd);
      } catch (err) {
        console.error('날짜 조절 업데이트 오류:', err);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, updateTaskDates]);

  // 완료 여부별 바 색상 클래스 분기
  const getBarColorClass = (progress: number) => {
    if (progress === 100) {
      return 'bg-emerald-500 dark:bg-emerald-500/80 border-emerald-600/35 text-white dark:text-zinc-100';
    }
    return 'bg-blue-500 dark:bg-blue-500/80 border-blue-600/35 text-white dark:text-zinc-100';
  };

  return (
    <div className="glass-panel p-5 overflow-hidden font-sans select-none">
      {/* 1. 간트 차트 헤더 제어 영역 */}
      <div className="flex items-center justify-between gap-4 mb-6 border-b border-zinc-500/10 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
            {timelineDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' ~ '}
            {timelineDates[totalDays - 1].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 text-zinc-650 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-center"
            title="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 text-[10px] font-bold tracking-tight text-zinc-650 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            TODAY
          </button>
          <button
            type="button"
            onClick={goNext}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 text-zinc-650 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-center"
            title="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 간트 차트 타임라인 레이아웃 */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[850px] flex">
          
          {/* A. 좌측 영역: 태스크 명세 요약 */}
          <div className="w-64 border-r border-zinc-500/10 pr-4 flex-shrink-0">
            {/* 리스트 헤더 */}
            <div className="h-14 flex items-center text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-500/10">
              {t('project.taskTitle')}
            </div>

            {/* 리스트 본문 */}
            <div 
              onDragOver={handleListDragOver}
              onDrop={handleListDrop}
              className="divide-y divide-zinc-500/5"
            >
              {displayTasks.length === 0 ? (
                <div className="py-20 text-center text-xs text-zinc-455">
                  {t('target.noGoals')}
                </div>
              ) : (
                displayTasks.map((task) => {
                  const isDraggingThis = task.id === draggedTaskId;

                  const itemStyle = {
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  };

                  const itemClassName = isDraggingThis
                    ? "h-[52px] rounded-lg border border-dashed border-blue-500/35 bg-blue-500/[0.015] my-2 transition-all duration-200 cursor-grab opacity-50"
                    : "h-[52px] flex flex-col justify-center py-2 text-xs cursor-grab active:cursor-grabbing hover:bg-zinc-500/5 px-2 rounded-lg transition-transform";

                  return (
                    <div
                      key={task.id}
                      data-list-id={task.id}
                      data-list-status={isDraggingThis ? "placeholder" : "static"}
                      draggable
                      style={itemStyle}
                      onDragStart={(e) => handleListDragStart(e, task.id)}
                      onDragEnd={handleListDragEnd}
                      className={itemClassName}
                    >
                      {!isDraggingThis && (
                        <>
                          <div className="font-semibold text-zinc-700 dark:text-zinc-200 truncate mb-1">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                            <span>{task.startDate} ~ {task.endDate}</span>
                            <span>{task.progress}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* B. 우측 영역: 그리드 캘린더 및 바 시각화 */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* 캘린더 날짜/요일 헤더 */}
            <div className="h-14 flex border-b border-zinc-500/10">
              {timelineDates.map((date, idx) => {
                const isToday = formatDate(date) === formatDate(new Date());
                const dayName = t('calendar.days')[date.getDay()];
                
                return (
                  <div
                    key={idx}
                    className={`w-9 flex-shrink-0 flex flex-col items-center justify-center text-[10px] border-r border-zinc-500/5 font-mono ${
                      isToday
                        ? 'bg-blue-500/5 text-blue-500 font-extrabold'
                        : 'text-zinc-450 dark:text-zinc-500'
                    }`}
                  >
                    <span>{date.getDate()}</span>
                    <span className="text-[8px] opacity-75">{dayName}</span>
                  </div>
                );
              })}
            </div>

            {/* 타임라인 간트 바 매핑 영역 */}
            <div className="relative divide-y divide-zinc-500/5">
              {displayTasks.length === 0 ? (
                <div className="h-[120px] flex items-center justify-center text-xs text-zinc-400">
                  {t('project.noTasks')}
                </div>
              ) : (
                displayTasks.map((task) => {
                  if (task.id === draggedTaskId) {
                    return (
                      <div
                        key={task.id}
                        className="h-[52px] w-full flex items-center relative overflow-hidden bg-blue-500/[0.005] border-y border-dashed border-blue-500/5"
                      />
                    );
                  }
                  const taskStart = parseDate(task.startDate);
                  const taskEnd = parseDate(task.endDate);
                  
                  // 마우스 드래그 변위 적용
                  const isCurrentDragging = dragState?.taskId === task.id;
                  const offset = isCurrentDragging ? dragState.lastDaysOffset : 0;
                  
                  let displayStart = taskStart;
                  let displayEnd = taskEnd;

                  if (isCurrentDragging) {
                    if (dragState.mode === 'move') {
                      displayStart = addDays(taskStart, offset);
                      displayEnd = addDays(taskEnd, offset);
                    } else if (dragState.mode === 'resize') {
                      const tempEnd = addDays(taskEnd, offset);
                      displayEnd = tempEnd < taskStart ? taskStart : tempEnd;
                    }
                  }

                  // 21일 타임라인 그리드 내 위치 계산
                  const startDiff = getDiffDays(displayStart, gridStartDate);
                  const endDiff = getDiffDays(displayEnd, gridStartDate);

                  // 그리드 뷰포트 마스킹 (범위 초과 시 픽셀 계산 클리핑)
                  const leftIndex = Math.max(0, startDiff);
                  const rightIndex = Math.min(totalDays - 1, endDiff);

                  // 화면에 일부라도 걸치는지 검사
                  const isVisible = leftIndex <= rightIndex && endDiff >= 0 && startDiff < totalDays;

                  // 픽셀 값 환산
                  const leftPixel = leftIndex * cellWidth;
                  const widthPixel = isVisible ? (rightIndex - leftIndex + 1) * cellWidth : 0;

                  return (
                    <div
                      key={task.id}
                      className="h-[52px] w-full flex items-center relative overflow-hidden bg-zinc-500/[0.01]"
                    >
                      {/* 뒷배경 세로 격자선 */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineDates.map((date, idx) => (
                          <div
                            key={idx}
                            className={`w-9 h-full border-r border-zinc-500/[0.03] flex-shrink-0 ${
                              formatDate(date) === formatDate(new Date())
                                ? 'bg-blue-500/[0.015]'
                                : ''
                            }`}
                          />
                        ))}
                      </div>

                      {/* 드래그 조작형 간트 바 (Gantt Bar) */}
                      {isVisible && (
                        <div
                          style={{
                            left: `${leftPixel}px`,
                            width: `${widthPixel}px`,
                          }}
                          className={`absolute h-7 rounded-md border flex items-center justify-between px-2 text-[10px] font-semibold tracking-tight shadow-sm cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-transform duration-150 ${getBarColorClass(
                            task.progress
                          )}`}
                          onMouseDown={(e) =>
                            handleDragStart(e, task.id, 'move', task.startDate, task.endDate)
                          }
                          title={`${task.title} (${task.progress}%)`}
                        >
                          <span className="truncate select-none pointer-events-none pr-1">
                            {task.title}
                          </span>

                          {/* 마감일 드래그 조절기 (Resize Handler) */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation(); // move 드래그 상속 방지
                              handleDragStart(e, task.id, 'resize', task.startDate, task.endDate);
                            }}
                            className="w-1.5 h-4 bg-white/40 dark:bg-zinc-900/50 rounded-full cursor-col-resize hover:bg-white/75 active:bg-white flex-shrink-0"
                            title="마감일 드래그 변경"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
