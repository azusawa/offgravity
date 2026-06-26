'use client';

import React, { useState } from 'react';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { useTranslation } from '@/hooks/useTranslation';
import { TimeBlockCategory } from '@/domain/entities/TimeBlock';
import { Plus, Trash2, Clock, Sparkles } from 'lucide-react';

/**
 * Life OS Dashboard - SchedulerView 컴포넌트
 * 
 * [역할]
 * 1. 하루의 일정을 24시간 타임라인 그리드 위에 absolute 위치로 정밀 렌더링합니다.
 * 2. 10분 단위의 시간 선택 셀렉터를 탑재한 미니멀 등록 폼을 제공합니다.
 * 3. 겹침 예외 시 브라우저 얼럿을 우회하여 사용자 에러 메시지로 편안하게 소통합니다.
 */
export default function SchedulerView() {
  const { t } = useTranslation();
  const { timeBlocks, loading, mounted, addTimeBlock, deleteTimeBlock } = useTimeBlocks();

  // --- [로컬 UI 상태] ---
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TimeBlockCategory>('work');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');

  // 1시간당 세로 픽셀 크기 정의 (44px)
  const HOUR_HEIGHT = 44;

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        {t('scheduler.loading')}
      </div>
    );
  }

  // 일정 추가 서브밋 핸들러
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await addTimeBlock(title, startHour, startMinute, endHour, endMinute, category);
      setTitle(''); // 등록 후 명칭 클리어
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('scheduler.errorSave'));
      }
    }
  };

  // 카테고리 텍스트 다국어 래퍼
  const getCatLabel = (cat: TimeBlockCategory) => {
    const labels = { 
      work: t('calendar.categoryWork'), 
      life: t('calendar.categoryLife'), 
      health: t('calendar.categoryHealth'), 
      growth: t('calendar.categoryGrowth') 
    };
    return labels[cat];
  };

  // 카테고리별 파스텔 그라데이션 및 명암 튜닝 클래스 매퍼
  const getCatColorClass = (cat: TimeBlockCategory) => {
    const colors = {
      work: 'bg-blue-50/70 border-blue-100 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/30 dark:text-blue-300',
      life: 'bg-emerald-50/70 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/30 dark:text-emerald-300',
      health: 'bg-rose-50/70 border-rose-100 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/30 dark:text-rose-300',
      growth: 'bg-purple-50/70 border-purple-100 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900/30 dark:text-purple-300'
    };
    return colors[cat];
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 1. 스케줄 등록 패널 */}
      <form onSubmit={handleAddBlock} className="glass-panel p-5 space-y-4 max-w-4xl">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-550" />
          <span>{t('scheduler.addBlock')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('calendar.eventTitle')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('scheduler.taskPlaceholder')}
              className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 placeholder-zinc-400"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('scheduler.startTime')}</label>
            <div className="flex gap-1.5">
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                className="flex-1 bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-850 dark:text-zinc-300 outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}{t('scheduler.hourSuffix')}</option>
                ))}
              </select>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(parseInt(e.target.value, 10))}
                className="flex-1 bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-850 dark:text-zinc-300 outline-none cursor-pointer"
              >
                {[0, 10, 20, 30, 40, 50].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}{t('scheduler.minuteSuffix')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('scheduler.endTime')}</label>
            <div className="flex gap-1.5">
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                className="flex-1 bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-850 dark:text-zinc-300 outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}{t('scheduler.hourSuffix')}</option>
                ))}
              </select>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(parseInt(e.target.value, 10))}
                className="flex-1 bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-850 dark:text-zinc-300 outline-none cursor-pointer"
              >
                {[0, 10, 20, 30, 40, 50].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}{t('scheduler.minuteSuffix')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('scheduler.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TimeBlockCategory)}
              className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-850 dark:text-zinc-300 outline-none cursor-pointer"
            >
              <option value="work">{t('calendar.categoryWork')}</option>
              <option value="life">{t('calendar.categoryLife')}</option>
              <option value="health">{t('calendar.categoryHealth')}</option>
              <option value="growth">{t('calendar.categoryGrowth')}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('scheduler.buttonAdd')}</span>
            </button>
          </div>
        </div>

        {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
      </form>

      {/* 2. 24시간 스케줄 타임라인 그리드 */}
      <div className="glass-panel p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-zinc-400">{t('scheduler.infoDesc')}</span>
        </div>

        {/* 24시간 타임라인 드로잉 영역 */}
        <div className="relative border border-zinc-500/10 rounded-xl bg-zinc-500/5 overflow-y-auto max-h-[580px] p-4 select-none">
          <div className="relative w-full" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
            
            {/* 시간 눈금 그리드 선 */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute left-0 w-full border-t border-dashed border-zinc-500/10 flex items-center text-[10px] text-zinc-400 font-mono pl-2"
                style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-500/10 shadow-sm leading-none translate-y-[-50%]">
                  {String(i).padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* 일정 플로팅 카드 목록 */}
            {timeBlocks.map((block) => {
              const startTotal = block.startHour * 60 + block.startMinute;
              const duration = block.durationMinutes;

              // 비율 변환 연산
              const topPos = startTotal * (HOUR_HEIGHT / 60);
              const heightPos = duration * (HOUR_HEIGHT / 60);

              return (
                <div
                  key={block.id}
                  className={`group absolute left-20 right-4 p-3 rounded-lg border flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:translate-x-0.5 ${getCatColorClass(block.category)}`}
                  style={{ 
                    top: `${topPos}px`, 
                    height: `${Math.max(heightPos, 36)}px`, // 최소 높이 36px 보장
                    zIndex: 10 
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight truncate pr-6">
                        {block.title}
                        <span className="text-[9px] font-semibold opacity-85 ml-1.5 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-zinc-500/5">
                          {getCatLabel(block.category)}
                        </span>
                      </span>
                      <span className="text-[10px] opacity-75 font-mono leading-none mt-1">
                        {String(block.startHour).padStart(2, '0')}:{String(block.startMinute).padStart(2, '0')} - {String(block.endHour).padStart(2, '0')}:{String(block.endMinute).padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteTimeBlock(block.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/5 transition-transform duration-200 hover:scale-115 hover:rotate-6 active:scale-90 cursor-pointer"
                      title={t('scheduler.deleteBlock')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 일정이 비어있을 때 안내 문구 */}
            {timeBlocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs pointer-events-none">
                {t('scheduler.noBlocks')}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
