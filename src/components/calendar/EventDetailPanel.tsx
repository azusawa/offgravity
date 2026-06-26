'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarEventType, CalendarEventCategory } from '@/domain/entities/CalendarEvent';
import { HolidaySettings } from '@/hooks/useHolidaySettings';
import { Plus, Trash2, Check, Edit2, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface EventDetailPanelProps {
  selectedDateStr: string;
  events: CalendarEvent[];
  holidaySettings: HolidaySettings;
  addCalendarEvent: (title: string, date: string, time: string | undefined, type: CalendarEventType, category: CalendarEventCategory, endDate?: string, endTime?: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  toggleEventCompletion: (id: string) => Promise<void>;
  updateCalendarEvent: (id: string, updates: { title: string; date: string; time?: string; endDate?: string; endTime?: string; type: CalendarEventType; category: CalendarEventCategory }) => Promise<void>;
}

const formatTimeInput = (value: string): string => {
  const nums = value.replace(/[^0-9]/g, '');
  if (nums.length <= 2) return nums;
  return `${nums.slice(0, 2)}:${nums.slice(2, 4)}`;
};

/**
 * Life OS Dashboard - EventDetailPanel 컴포넌트
 * [설명] 국가별 법정 공휴일 On/Off 설정 스위치를 갖추어 달력 상에 공휴일을 활성/비활성 처리할 수 있도록 지원합니다.
 */
export default function EventDetailPanel({
  selectedDateStr,
  events,
  holidaySettings,
  addCalendarEvent,
  deleteCalendarEvent,
  toggleEventCompletion,
  updateCalendarEvent
}: EventDetailPanelProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('event');
  const [category, setCategory] = useState<CalendarEventCategory>('work');
  const [startDateInput, setStartDateInput] = useState(selectedDateStr);
  const [timeInput, setTimeInput] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [endDateInput, setEndDateInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!editingEvent) {
        setStartDateInput(selectedDateStr);
        if (!isRange) setEndDateInput(selectedDateStr);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDateStr, isRange, editingEvent]);

  const isEventOnDay = (ev: CalendarEvent, dateStr: string) => {
    return dateStr >= ev.date && dateStr <= (ev.endDate || ev.date);
  };
  const selectedDayEvents = events.filter((ev) => isEventOnDay(ev, selectedDateStr));

  const handleStartEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev); setTitle(ev.title); setType(ev.type); setCategory(ev.category); setStartDateInput(ev.date);
    setTimeInput(ev.time || ''); setIsRange(!!ev.endDate); setEndDateInput(ev.endDate || ev.date); setEndTimeInput(ev.endTime || '');
    setErrorMsg('');
  };

  const resetForm = () => {
    setTitle(''); setTimeInput(''); setEndDateInput(''); setEndTimeInput(''); setIsRange(false);
    setEditingEvent(null); setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) return setErrorMsg(t('calendar.titleRequired'));

    try {
      const time = timeInput.trim() || undefined;
      const endDate = isRange ? endDateInput || undefined : undefined;
      const endTime = isRange ? endTimeInput || undefined : undefined;

      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, { title, date: startDateInput, time, endDate, endTime, type, category });
      } else {
        await addCalendarEvent(title, startDateInput, time, type, category, endDate, endTime);
      }
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
    }
  };

  const getEventColorClass = (eventId: string) => {
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700/30',
      'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700/30',
      'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700/30',
      'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700/30',
      'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700/30',
      'bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700/30',
      'bg-pink-500/15 text-pink-600 border-pink-500/30 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700/30',
      'bg-indigo-500/15 text-indigo-600 border-indigo-500/30 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700/30',
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* 1. 일정 리스트 */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-white border-b border-zinc-500/10 pb-3 flex items-center justify-between">
          <span>{selectedDateStr} {t('calendar.eventDetail')}</span>
          <span className="text-[10px] text-zinc-400 font-mono">{t('calendar.numEvents', { count: selectedDayEvents.length })}</span>
        </h3>
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">{t('calendar.noEvents')}</p>
          ) : (
            selectedDayEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-500/5 border border-zinc-500/5 transition-all hover:bg-zinc-500/10 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {ev.type === 'deadline' && (
                    <button type="button" onClick={() => toggleEventCompletion(ev.id)} className={`p-0.5 rounded border transition-all cursor-pointer flex items-center justify-center ${ev.isCompleted ? 'bg-zinc-900 border-transparent text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold truncate ${ev.type === 'deadline' && ev.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{ev.title}</span>
                    <span className="text-[9px] text-zinc-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`px-1 rounded-[3px] border ${getEventColorClass(ev.id)}`}>{ev.type === 'event' ? t('calendar.event') : t('calendar.deadline')}</span>
                      {ev.endDate && ev.endDate !== ev.date ? (
                        <span>{ev.date}{ev.time ? ` ${ev.time}` : ''} ~ {ev.endDate}{ev.endTime ? ` ${ev.endTime}` : ''}</span>
                      ) : (
                        <span>{ev.time && `${ev.time}`}{ev.endTime && ` ~ ${ev.endTime}`}</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => handleStartEdit(ev)} className="p-1 rounded text-zinc-400 hover:text-blue-500 hover:bg-blue-500/5 transition-transform duration-200 hover:scale-115 active:scale-90 opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteCalendarEvent(ev.id)} className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/5 transition-transform duration-200 hover:scale-115 hover:rotate-6 active:scale-90 opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. 일정 수립/수정 폼 */}
      <form onSubmit={handleSubmit} className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-white border-b border-zinc-500/10 pb-3">
          {editingEvent ? t('calendar.eventEdit') : t('calendar.eventAdd')}
        </h3>
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">{t('calendar.eventTitle')}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('calendar.eventTitlePlaceholder')} className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-150" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400">{t('calendar.eventType')}</label>
              <select value={type} onChange={(e) => setType(e.target.value as CalendarEventType)} className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-zinc-850 dark:text-zinc-300">
                <option value="event">{t('calendar.event')}</option>
                <option value="deadline">{t('calendar.deadline')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400">{t('calendar.eventCategory')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CalendarEventCategory)} className="w-full bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-zinc-850 dark:text-zinc-300">
                <option value="work">{t('calendar.categoryWork')}</option>
                <option value="life">{t('calendar.categoryLife')}</option>
                <option value="health">{t('calendar.categoryHealth')}</option>
                <option value="growth">{t('calendar.categoryGrowth')}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 py-1 select-none">
            <input type="checkbox" id="rangeToggle" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} className="rounded border-zinc-300 dark:border-zinc-700 accent-blue-500 cursor-pointer" />
            <label htmlFor="rangeToggle" className="text-[10px] text-zinc-500 dark:text-zinc-400 cursor-pointer font-semibold">{t('calendar.isRange')}</label>
          </div>
          <div className="space-y-2 bg-zinc-500/5 p-2.5 rounded-lg border border-zinc-500/5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400">{t('calendar.startDate')}</label>
                <input type="date" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-zinc-850 dark:text-zinc-300" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400">{t('calendar.startTime')}</label>
                <input type="text" value={timeInput} onChange={(e) => setTimeInput(formatTimeInput(e.target.value))} placeholder={t('calendar.startTimePlaceholder')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-zinc-850 dark:text-zinc-300" />
              </div>
            </div>
            {isRange && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-500/10">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400">{t('calendar.endDate')}</label>
                  <input type="date" value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-zinc-850 dark:text-zinc-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400">{t('calendar.endTime')}</label>
                  <input type="text" value={endTimeInput} onChange={(e) => setEndTimeInput(formatTimeInput(e.target.value))} placeholder={t('calendar.endTimePlaceholder')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-zinc-850 dark:text-zinc-300" />
                </div>
              </div>
            )}
          </div>
          {editingEvent ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{t('calendar.submitEdit')}</span>
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                <span>{t('calendar.cancel')}</span>
              </button>
            </div>
          ) : (
            <button type="submit" className="w-full mt-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>{t('calendar.submitAdd')}</span>
            </button>
          )}
        </div>
        {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
      </form>

      {/* 3. 공휴일 표시 설정 패널 */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase border-b border-zinc-500/10 pb-2">{t('calendar.holidaySettings')}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs select-none">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={holidaySettings.showKR} onChange={holidaySettings.toggleKR} className="rounded border-zinc-300 dark:border-zinc-700 accent-red-500 cursor-pointer" />
            <span className="text-zinc-650 dark:text-zinc-350">{t('calendar.countryKR')}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={holidaySettings.showJP} onChange={holidaySettings.toggleJP} className="rounded border-zinc-300 dark:border-zinc-700 accent-rose-500 cursor-pointer" />
            <span className="text-zinc-650 dark:text-zinc-350">{t('calendar.countryJP')}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={holidaySettings.showUS} onChange={holidaySettings.toggleUS} className="rounded border-zinc-300 dark:border-zinc-700 accent-indigo-500 cursor-pointer" />
            <span className="text-zinc-650 dark:text-zinc-350">{t('calendar.countryUS')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
