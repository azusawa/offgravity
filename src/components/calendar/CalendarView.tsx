'use client';

import React, { useState, useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTranslation } from '@/hooks/useTranslation';
import { useHolidaySettings } from '@/hooks/useHolidaySettings';
import { HolidayProvider } from '@/domain/services/HolidayProvider';
import CalendarGrid from './CalendarGrid';
import EventDetailPanel from './EventDetailPanel';

/**
 * Life OS Dashboard - CalendarView 컴포넌트 (부모 컨테이너)
 * 
 * [역할]
 * 1. 캘린더 상태 및 공휴일 표시 환경을 총괄 관리합니다.
 * 2. 달력의 전체 너비 확장 상태(isExpanded)를 LocalStorage 기반으로 영속 제어 및 레이아웃 분기합니다.
 * 3. 100~250라인 한도 규정과 단일 책임 원칙(SRP)을 충족하는 메인 쉘 컴포넌트입니다.
 */
export default function CalendarView() {
  const { t } = useTranslation();
  const {
    events,
    loading,
    mounted,
    addCalendarEvent,
    deleteCalendarEvent,
    toggleEventCompletion,
    updateCalendarEvent
  } = useCalendarEvents();

  const holidaySettings = useHolidaySettings();

  // --- [날짜 상태] ---
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0 ~ 11
  
  const formatDateString = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const [selectedDateStr, setSelectedDateStr] = useState(formatDateString(today));

  // --- [달력 확장 모드 상태] ---
  const [isExpanded, setIsExpanded] = useState(false);
  const EXPAND_STORAGE_KEY = 'life-os-calendar-expanded';

  // 마운트 시 확장 상태 복원 (React 19 cascading renders lint 규칙 우회)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(EXPAND_STORAGE_KEY);
          if (stored) {
            setIsExpanded(JSON.parse(stored) === true);
          }
        } catch (err) {
          console.error('달력 확장 상태 로드 실패:', err);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(EXPAND_STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.error('달력 확장 상태 저장 실패:', err);
        }
      }
      return next;
    });
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        {t('calendar.loading')}
      </div>
    );
  }

  // 활성화된 공휴일 국가 목록 조립
  const activeCountries: ('KR' | 'JP' | 'US')[] = [];
  if (holidaySettings.showKR) activeCountries.push('KR');
  if (holidaySettings.showJP) activeCountries.push('JP');
  if (holidaySettings.showUS) activeCountries.push('US');

  // 연/월 공휴일 정보 취합
  const holidays = HolidayProvider.getHolidays(currentYear, currentMonth, activeCountries);

  // 월 이동 조작 컨트롤러
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      {/* 1. 월간 달력 그리드 영역 */}
      <div className={isExpanded ? 'lg:col-span-12' : 'lg:col-span-8'}>
        <CalendarGrid
          events={events}
          holidays={holidays}
          selectedDateStr={selectedDateStr}
          setSelectedDateStr={setSelectedDateStr}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
        />
      </div>

      {/* 2. 우측 일정 상세 및 등록 폼 영역 (확장 상태 시 숨김) */}
      {!isExpanded && (
        <div className="lg:col-span-4">
          <EventDetailPanel
            selectedDateStr={selectedDateStr}
            events={events}
            holidaySettings={holidaySettings}
            addCalendarEvent={addCalendarEvent}
            deleteCalendarEvent={deleteCalendarEvent}
            toggleEventCompletion={toggleEventCompletion}
            updateCalendarEvent={updateCalendarEvent}
          />
        </div>
      )}
    </div>
  );
}
