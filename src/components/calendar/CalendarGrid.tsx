'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '@/domain/entities/CalendarEvent';
import { HolidayInfo } from '@/domain/services/HolidayProvider';
import { Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ko } from '@/locales/ko';
import { en } from '@/locales/en';
import { ja } from '@/locales/ja';

const dicts = { ko, en, ja };

interface CalendarGridProps {
  events: CalendarEvent[];
  holidays: HolidayInfo[];
  selectedDateStr: string;
  setSelectedDateStr: (date: string) => void;
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * Life OS Dashboard - CalendarGrid 컴포넌트
 * [설명] 확장 모드(isExpanded)에 대응하여, 셀 최소 높이를 140px로 늘리고 일정 노출 슬롯도 5개로 늘려 가시성을 극대화합니다.
 */
export default function CalendarGrid({
  events,
  holidays,
  selectedDateStr,
  setSelectedDateStr,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  isExpanded,
  onToggleExpand
}: CalendarGridProps) {
  const { t, locale } = useTranslation();
  // SSR 환경 대응을 위한 포탈 마운트 상태 추적 (React 19 cascading renders 룰 우회)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const formatDateString = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dateStr: formatDateString(new Date(year, month - 1, prevMonthLastDay - i)),
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false
      });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        dateStr: formatDateString(new Date(year, month, d)),
        dayNum: d,
        isCurrentMonth: true
      });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        dateStr: formatDateString(new Date(year, month + 1, d)),
        dayNum: d,
        isCurrentMonth: false
      });
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

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

  const isEventInWeek = (ev: CalendarEvent, week: typeof calendarDays) => {
    const start = ev.date;
    const end = ev.endDate || ev.date;
    return start <= week[6].dateStr && end >= week[0].dateStr;
  };

  const getRangeStyle = (ev: CalendarEvent, dateStr: string, dayIdx: number) => {
    const start = ev.date;
    const end = ev.endDate || ev.date;
    if (start === end) return 'rounded-md mx-1 relative z-10 border-l-2 border-l-current';

    const isStart = start === dateStr;
    const isEnd = end === dateStr;
    const isWeekStart = dayIdx === 0;
    const isWeekEnd = dayIdx === 6;

    if (isStart) return 'rounded-l-md border-r-0 border-l-[4px] border-l-current -mr-[5px] pl-1 relative z-10';
    if (isEnd) return 'rounded-r-md border-l-0 border-r-[4px] border-r-current -ml-[5px] pr-1 relative z-10';
    if (isWeekStart) return 'rounded-l-sm border-r-0 -mr-[5px] pl-1 relative z-10';
    if (isWeekEnd) return 'rounded-r-sm border-l-0 -ml-[5px] pr-1 relative z-10';

    return 'rounded-none border-x-0 -mx-[5px] relative z-10';
  };

  const getHolidayTextClass = (country: 'KR' | 'JP' | 'US') => {
    const styles = {
      KR: 'text-red-400 dark:text-red-300',
      JP: 'text-rose-400 dark:text-rose-300',
      US: 'text-indigo-400 dark:text-indigo-300'
    };
    return `${styles[country]} text-[9.5px] font-semibold truncate max-w-[60px] opacity-90`;
  };

  // 확장 여부에 따른 최대 노출 슬롯 개수 동적 지정
  const maxSlots = isExpanded ? 5 : 3;

  const gridContent = (
    <div className={
      isExpanded 
        ? 'fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col h-screen w-screen overflow-hidden space-y-4'
        : 'glass-panel p-5 space-y-4'
    }>
      {/* 달력 상단 바 */}
      <div className="flex items-center justify-between border-b border-zinc-500/10 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-zinc-700 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>
            {locale === 'en' 
              ? `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentMonth]} ${currentYear}`
              : locale === 'ja'
              ? `${currentYear}年 ${currentMonth + 1}月`
              : `${currentYear}년 ${currentMonth + 1}월`
            }
          </span>
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={onToggleExpand} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 transition-transform duration-200 active:scale-90 cursor-pointer mr-1" title={isExpanded ? t('calendar.minimizedTitle') : t('calendar.maximizedTitle')}>
            {isExpanded ? <Minimize2 className="w-4 h-4 text-zinc-650 dark:text-zinc-200" /> : <Maximize2 className="w-4 h-4 text-zinc-650 dark:text-zinc-200" />}
          </button>
          <button type="button" onClick={onPrevMonth} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 transition-transform duration-200 active:scale-90 cursor-pointer" title={t('calendar.prevMonth')}>
            <ChevronLeft className="w-4 h-4 text-zinc-650 dark:text-zinc-200" />
          </button>
          <button type="button" onClick={onNextMonth} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 transition-transform duration-200 active:scale-90 cursor-pointer" title={t('calendar.nextMonth')}>
            <ChevronRight className="w-4 h-4 text-zinc-650 dark:text-zinc-200" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 py-1">
        {dicts[locale].calendar.days.map((w, idx) => (
          <div key={w} className={idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : ''}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 (주 단위 묶음) */}
      <div className={`bg-zinc-500/5 p-1 rounded-lg border border-zinc-500/10 space-y-1 ${isExpanded ? 'flex-1 flex flex-col justify-between overflow-hidden' : ''}`}>
        {weeks.map((week, wIdx) => {
          const weekEvents = events.filter((ev) => isEventInWeek(ev, week));
          weekEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            const durA = new Date(a.endDate || a.date).getTime() - new Date(a.date).getTime();
            const durB = new Date(b.endDate || b.date).getTime() - new Date(b.date).getTime();
            if (durA !== durB) return durB - durA;
            return a.title.localeCompare(b.title);
          });

          // 요일(0~6)별로 maxSlots 개의 슬롯 상태 관리
          const slots: (CalendarEvent | null)[][] = Array.from({ length: 7 }, () => Array(maxSlots).fill(null));

          weekEvents.forEach((ev) => {
            let startIdx = 0;
            let endIdx = 6;
            week.forEach((day, dIdx) => {
              if (day.dateStr === ev.date) startIdx = dIdx;
              if (day.dateStr === (ev.endDate || ev.date)) endIdx = dIdx;
            });
            if (ev.date < week[0].dateStr) startIdx = 0;
            if ((ev.endDate || ev.date) > week[6].dateStr) endIdx = 6;

            let targetSlot = -1;
            for (let slot = 0; slot < maxSlots; slot++) {
              let avail = true;
              for (let d = startIdx; d <= endIdx; d++) {
                if (slots[d][slot] !== null) { avail = false; break; }
              }
              if (avail) { targetSlot = slot; break; }
            }

            if (targetSlot !== -1) {
              for (let d = startIdx; d <= endIdx; d++) {
                slots[d][targetSlot] = ev;
              }
            }
          });

            return (
              <div key={wIdx} className={`grid grid-cols-7 gap-1 relative overflow-visible ${isExpanded ? 'flex-1 min-h-[80px]' : 'min-h-[82px]'}`}>
              {/* A. 배경 및 날짜 표시 레이어 (Grid) */}
              {week.map((day, dIdx) => {
                const isSelected = day.dateStr === selectedDateStr;
                const dayHoliday = holidays.find((h) => h.date === day.dateStr);
                const isHoliday = !!dayHoliday;

                const dayColorClass = !day.isCurrentMonth
                  ? 'text-zinc-350 dark:text-zinc-700'
                  : dIdx === 0 || isHoliday
                  ? 'text-red-400 dark:text-red-400'
                  : dIdx === 6
                  ? 'text-blue-400 dark:text-blue-450'
                  : 'text-zinc-700 dark:text-zinc-300';

                return (
                  <div
                    key={dIdx}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`h-full border flex flex-col justify-start transition-all duration-200 cursor-pointer select-none rounded-md ${
                      day.isCurrentMonth ? 'bg-white dark:bg-zinc-950/60' : 'bg-zinc-50/40 text-zinc-300 dark:bg-zinc-950/20 dark:text-zinc-600'
                    } ${
                      isSelected 
                        ? 'border-blue-400 ring-2 ring-blue-400/20 dark:border-blue-400/50' 
                        : 'border-zinc-500/5 hover:border-zinc-300 dark:hover:border-zinc-800'
                    } ${isExpanded ? 'pt-1.5 pb-2 px-0' : 'pt-1 pb-1.5 px-0'}`}
                  >
                    <div className="flex justify-between items-center px-1.5">
                      <span className={`text-[12px] font-bold ${dayColorClass}`}>
                        {day.dayNum}
                      </span>
                      {dayHoliday && (
                        <span className={getHolidayTextClass(dayHoliday.country)}>
                          {dayHoliday.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* B. 일정 표시 오버레이 그리드 (투명, absolute) */}
              <div className="grid grid-cols-7 gap-1 absolute inset-x-0 bottom-1.5 top-6 pointer-events-none overflow-visible z-10">
                {week.map((day, dIdx) => {
                  const dayEvents = slots[dIdx];

                  return (
                    <div
                      key={dIdx}
                      onClick={() => setSelectedDateStr(day.dateStr)}
                      className="pointer-events-auto h-full flex flex-col justify-end space-y-1 relative overflow-visible px-0"
                    >
                      {dayEvents.map((ev, sIdx) => {
                        if (!ev) return <div key={sIdx} className="h-4" />;
                        const isStart = ev.date === day.dateStr || dIdx === 0;
                        const isRealStart = ev.date === day.dateStr;
                        const isRealEnd = (ev.endDate || ev.date) === day.dateStr;
                        const isRange = !!ev.endDate && ev.endDate !== ev.date;

                        let displayText = '';
                        if (isStart || isRealEnd) {
                          const timeStr = ev.time ? `${ev.time} ` : '';
                          const mainText = `${timeStr}${ev.title}`;
                          if (isRange && isRealStart) {
                            displayText = `▸ ${mainText}`;
                          } else if (isRange && isRealEnd) {
                            displayText = `${mainText} ◂`;
                          } else {
                            displayText = mainText;
                          }
                        }

                        const rangeStyle = getRangeStyle(ev, day.dateStr, dIdx);

                        return (
                          <div
                            key={sIdx}
                            className={`text-[8.5px] h-4 px-1 flex items-center border leading-none truncate select-none ${
                              ev.type === 'deadline' && ev.isCompleted ? 'line-through opacity-50' : ''
                            } ${getEventColorClass(ev.id)} ${rangeStyle} ${
                              isRealStart || isRealEnd ? 'font-bold' : ''
                            }`}
                          >
                            {displayText}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isExpanded) {
    if (!isMounted) return null;
    return createPortal(gridContent, document.body);
  }

  return gridContent;
}
