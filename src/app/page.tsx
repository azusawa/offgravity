'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useTargetGoals } from '@/hooks/useTargetGoals';
import TargetGoalsView from '@/components/target/TargetGoalsView';
import SchedulerView from '@/components/schedule/SchedulerView';
import CalendarView from '@/components/calendar/CalendarView';
import ProjectManagementView from '@/components/project/ProjectManagementView';
import { 
  Clock, 
  Compass, 
  Play, 
  Pause, 
  RotateCcw, 
  ListTodo,
  ArrowRight,
  Check
} from 'lucide-react';

/**
 * Life OS Dashboard - 메인 페이지 컨트롤러
 * 
 * [역할]
 * 1. 좌측 사이드바 탭 클릭 상태(activeTab)에 따라 '대시보드'와 '목표 설정' 뷰를 스위칭합니다.
 * 2. MainLayout 컴포넌트를 호출하여 전역 프레젠테이션 스위치를 바인딩합니다.
 * 3. '대시보드' 활성화 시, 마인드셋 격언 시계, 뽀모도로 포커스 타이머, 오늘의 목표 메모 위젯을 렌더링합니다.
 * 4. '목표 설정' 활성화 시, 주간/연간/생애 목표 설정 및 진척도를 관리하는 TargetGoalsView를 렌더링합니다.
 */
export default function HomePage() {
  const { t } = useTranslation();
  const { goals, toggleTodoInGoal } = useTargetGoals();
  
  // --- [상태 정의] ---
  // 1. 활성 탭 상태 ('dashboard': 마인드셋 보드, 'targets': 목표 설정, 'scheduler': 스케줄러, 'calendar': 달력, 'project': 프로젝트 관리)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'targets' | 'scheduler' | 'calendar' | 'project'>('dashboard');

  // 2. 실시간 시계 상태
  const [time, setTime] = useState<string>('');
  
  // 3. 포커스 타이머 상태
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25분 기본값
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // 미완료 상태인 할 일들만 추출하여 목표 정보 결합
  const activeTodos = goals.flatMap((g) =>
    g.todos
      .filter((t) => !t.isCompleted)
      .map((todo) => ({
        ...todo,
        goalId: g.id,
        goalTitle: g.title,
        goalCategory: g.category,
      }))
  );

  // --- [이펙트 처리] ---
  
  // 1. 실시간 시계 업데이트 (1초 간격)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. 포커스 타이머 구동 로직 (React 19 cascading render 린트 가드 적용)
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            setIsTimerRunning(false);
            alert(t('dashboard.stretchAlert'));
          }, 0);
          return 25 * 60; // 타이머 리셋
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, t]);

  // --- [이벤트 핸들러] ---
  


  // 타이머 제어 핸들러
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(25 * 60);
  };

  // 분/초 포맷 변환 헬퍼 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 실시간 시계 렌더 헬퍼 (콜론 깜빡임 제거 및 색상 통일)
  const renderTime = (timeStr: string) => {
    if (!timeStr) return <span>00:00:00</span>;
    const parts = timeStr.split(':');
    if (parts.length < 3) return <span>{timeStr}</span>;
    return (
      <span className="flex items-center justify-center font-mono">
        {parts[0]}
        <span className="mx-0.5">:</span>
        {parts[1]}
        <span className="mx-0.5">:</span>
        {parts[2]}
      </span>
    );
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' ? (
        <div className="space-y-10 py-4 relative animate-fade-in-up">
          {/* 대시보드 환영 영역 */}
          <section className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('dashboard.mindsetBoard')}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg leading-relaxed">
              {t('dashboard.descNormal')}
            </p>
          </section>

          {/* 대시보드 위젯 3종 배치 (Anti-Gravity 테마 반응형 그리드) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 카드 1: 시간 및 무중력 격언 (움직임 속도: Slow) */}
            <div className="group glass-panel p-6 flex flex-col justify-between min-h-[240px] animate-float-slow">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[15px] font-semibold tracking-tight text-zinc-500 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500/60 dark:text-indigo-300 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                    <span>{t('dashboard.currentTime')}</span>
                  </span>
                  <span className="text-xs text-zinc-400/70 dark:text-zinc-100 font-mono">{t('dashboard.orbitType')}</span>
                </div>
                <div className="text-4xl tracking-widest text-zinc-650 dark:text-white">
                  {renderTime(time)}
                </div>
              </div>
              <div className="mt-6 border-t border-zinc-500/10 pt-4">
                <p className="text-sm italic text-zinc-400 dark:text-zinc-300 leading-relaxed">
                  &ldquo;{t('dashboard.quote')}&rdquo;
                </p>
              </div>
            </div>

            {/* 카드 2: 집중 포커스 뽀모도로 타이머 (움직임 속도: Medium) */}
            <div className="group glass-panel p-6 flex flex-col justify-between min-h-[240px] animate-float-medium">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[15px] font-semibold tracking-tight text-zinc-500 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500/65 dark:text-emerald-300 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110" />
                  <span>{t('dashboard.focusMode')}</span>
                </span>
                <span className="text-xs text-zinc-400/70 dark:text-zinc-100 font-mono">{t('dashboard.focusOrbit')}</span>
              </div>
              
              <div className="text-center my-2">
                <p className="text-5xl font-mono font-medium dark:font-bold tracking-wider text-zinc-650 dark:text-white">
                  {formatTime(timeLeft)}
                </p>
              </div>

              <div className="flex justify-center gap-2.5 mt-4">
                <button
                  onClick={toggleTimer}
                  className={`p-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center border active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-50/75 border-amber-200 dark:bg-amber-500/20 dark:border-amber-400/30 text-amber-600 dark:text-amber-200 hover:bg-amber-100/80 dark:hover:bg-amber-500/30 shadow-sm'
                      : 'bg-emerald-50/75 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-400/30 text-emerald-600 dark:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/30 shadow-sm'
                  }`}
                  aria-label={isTimerRunning ? t('dashboard.pause') : t('dashboard.start')}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2.5 rounded-lg bg-zinc-500/5 hover:bg-zinc-500/10 text-zinc-550 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  aria-label={t('dashboard.reset')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 카드 3: 오늘의 ToDo 리스트 (움직임 속도: Fast) */}
            <div className="group glass-panel p-6 flex flex-col justify-between min-h-[240px] lg:col-span-1 md:col-span-2 animate-float-fast">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[15px] font-semibold tracking-tight text-zinc-500 dark:text-white flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-amber-500/65 dark:text-amber-300 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  <span>{t('dashboard.todoTitle')}</span>
                </span>
                <span className="text-xs text-zinc-400/70 dark:text-zinc-100 font-mono">{t('dashboard.todoOrbit')}</span>
              </div>
              
              <div className="flex-1 flex flex-col justify-center my-1.5 font-sans">
                {activeTodos.length === 0 ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-[11px] md:text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
                      {t('dashboard.todoEmpty')}
                    </p>
                    <button
                      onClick={() => setActiveTab('targets')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-650 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1"
                    >
                      <span>{t('dashboard.goToGoals')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {activeTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between group/todoItem text-[13px] text-zinc-650 dark:text-zinc-200"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTodoInGoal(todo.goalId, todo.id)}
                            className="p-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-transparent hover:border-zinc-400 dark:hover:border-zinc-500 active:scale-90 cursor-pointer flex items-center justify-center"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <span>{todo.title}</span>
                        </div>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-zinc-500/5 border border-zinc-500/10 text-zinc-400/85">
                          {todo.goalTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 text-right">
                <span className="text-[10px] text-zinc-400/80 font-mono">
                  {activeTodos.length} {t('calendar.event')}
                </span>
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'targets' ? (
        <TargetGoalsView />
      ) : activeTab === 'project' ? (
        <ProjectManagementView />
      ) : activeTab === 'scheduler' ? (
        <SchedulerView />
      ) : (
        <CalendarView />
      )}
    </MainLayout>
  );
}
