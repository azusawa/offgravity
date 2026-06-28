'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskStatus } from '@/domain/entities/ProjectTask';
import { Plus, X, Calendar, LayoutGrid } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import GanttChart from './GanttChart';

/**
 * Life OS Dashboard - ProjectManagementView 컴포넌트
 * 
 * [설명]
 * 프로젝트 관리 모듈의 메인 엔트리포인트 컴포넌트입니다.
 * 칸반 보드와 간트 차트 뷰를 스위칭하고 신규 태스크 생성을 통합 처리합니다.
 */
export default function ProjectManagementView() {
  const { t } = useTranslation();
  const {
    tasks,
    loading,
    mounted,
    addTask,
    updateTaskDates,
    updateTaskProgress,
    updateTaskInfo,
    deleteTask,
    reorderTasks,
  } = useProjectTasks();

  const [activeView, setActiveView] = useState<'kanban' | 'gantt'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 신규 등록 폼 필드 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  
  // 날짜 기본값 설정 (시작일: 오늘, 마감일: 내일)
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTomorrowString());

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        {t('target.loading')}
      </div>
    );
  }

  // 작업 추가 핸들러
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg(t('target.titleRequired'));
      return;
    }

    try {
      await addTask({
        title,
        description,
        status,
        startDate,
        endDate,
      });
      // 폼 비우기 및 모달 닫기
      setTitle('');
      setDescription('');
      setStatus('todo');
      setStartDate(getTodayString());
      setEndDate(getTomorrowString());
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('project.errorAdd'));
      }
    }
  };

  return (
    <div className="space-y-8 relative animate-fade-in-up">
      {/* 1. 상단 컨트롤 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-500/10 pb-4">
        <div className="flex items-center gap-1.5 bg-zinc-500/5 p-1 rounded-lg border border-zinc-500/10 select-none">
          <button
            onClick={() => setActiveView('kanban')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'kanban'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('project.kanban')}</span>
          </button>
          <button
            onClick={() => setActiveView('gantt')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'gantt'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('project.gantt')}</span>
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('project.addTask')}</span>
        </button>
      </div>

      {/* 2. 본문 뷰 렌더러 */}
      <div className="w-full">
        {activeView === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            updateTaskProgress={updateTaskProgress}
            updateTaskInfo={updateTaskInfo}
            deleteTask={deleteTask}
            reorderTasks={reorderTasks}
          />
        ) : (
          <GanttChart
            tasks={tasks}
            updateTaskDates={updateTaskDates}
          />
        )}
      </div>

      {/* 3. 신규 태스크 생성 모달 다이얼로그 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 bg-opacity-95 dark:bg-opacity-95 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-500/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer flex items-center justify-center border border-transparent"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
              {t('project.addTask')}
            </h3>

            <form onSubmit={handleAddTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.taskTitle')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('project.taskTitlePlaceholder')}
                  className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 placeholder-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.taskDesc')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('project.taskDescPlaceholder')}
                  className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 placeholder-zinc-400 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('project.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('calendar.eventType')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-350 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
                >
                  <option value="todo">{t('project.todo')}</option>
                  <option value="in_progress">{t('project.inProgress')}</option>
                  <option value="done">{t('project.done')}</option>
                </select>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 text-zinc-650 dark:text-zinc-350 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  {t('calendar.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
                >
                  {t('project.submitAdd')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
