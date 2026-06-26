'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, CalendarEventType, CalendarEventCategory } from '../domain/entities/CalendarEvent';
import { LocalStorageCalendarEventRepository } from '../data/repositories/LocalStorageCalendarEventRepository';

/**
 * Life OS Dashboard - useCalendarEvents 프레젠테이션 컨트롤러 훅
 * 
 * [설명]
 * 1. UI의 캘린더 상태와 LocalStorage 영속화 레이어를 연결하는 중재자 역할을 담당합니다.
 * 2. React 19 ESLint Cascading Render 방지를 위해 마운트 비동기화를 적용했습니다.
 * 3. 기간 지정을 위한 매개변수를 신규 추가 및 전달 지원합니다.
 */
export function useCalendarEvents() {
  const repository = useMemo(() => new LocalStorageCalendarEventRepository(), []);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // 데이터 조회
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await repository.getEvents();
        // 날짜/시간 순 정렬
        const sortedList = [...list].sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
        });
        setEvents(sortedList);
      } catch (err) {
        console.error('캘린더 일정 로드 에러:', err);
      } finally {
        setTimeout(() => {
          setMounted(true);
          setLoading(false);
        }, 0);
      }
    };

    fetchEvents();
  }, [repository]);

  /**
   * 신규 일정 등록
   */
  const addCalendarEvent = async (
    title: string,
    date: string,
    time: string | undefined,
    type: CalendarEventType,
    category: CalendarEventCategory,
    endDate?: string,
    endTime?: string
  ): Promise<void> => {
    const newId = typeof window !== 'undefined' ? crypto.randomUUID() : Math.random().toString();
    const formattedTime = time && time.trim() !== '' ? time.trim() : undefined;
    const formattedEndDate = endDate && endDate.trim() !== '' ? endDate.trim() : undefined;
    const formattedEndTime = endTime && endTime.trim() !== '' ? endTime.trim() : undefined;

    const newEvent = new CalendarEvent({
      id: newId,
      title,
      date,
      time: formattedTime,
      endDate: formattedEndDate,
      endTime: formattedEndTime,
      type,
      category
    });

    await repository.saveEvent(newEvent);

    setEvents((prev) => {
      const nextList = [...prev, newEvent];
      return nextList.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
  };

  /**
   * 일정 삭제
   */
  const deleteCalendarEvent = async (id: string): Promise<void> => {
    await repository.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  /**
   * 데드라인 완료 여부 토글
   */
  const toggleEventCompletion = async (id: string): Promise<void> => {
    await repository.toggleEventCompletion(id);
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return e.toggleCompletion();
        }
        return e;
      })
    );
  };

  /**
   * 일정 정보 수정
   */
  const updateCalendarEvent = async (
    id: string,
    updates: {
      title: string;
      date: string;
      time?: string;
      endDate?: string;
      endTime?: string;
      type: CalendarEventType;
      category: CalendarEventCategory;
    }
  ): Promise<void> => {
    const list = await repository.getEvents();
    const target = list.find((e) => e.id === id);
    if (!target) {
      throw new Error('대상 일정을 찾을 수 없습니다.');
    }

    const updatedEvent = target.update(updates);
    await repository.saveEvent(updatedEvent);

    setEvents((prev) => {
      const nextList = prev.map((e) => (e.id === id ? updatedEvent : e));
      return nextList.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
  };

  return {
    events,
    loading,
    mounted,
    addCalendarEvent,
    deleteCalendarEvent,
    toggleEventCompletion,
    updateCalendarEvent
  };
}

