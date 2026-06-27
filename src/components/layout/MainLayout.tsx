'use client';

import React from 'react';
import { useThemeContext } from '@/components/theme/ThemeProvider';
import { Theme } from '@/types/theme';
import { useTranslation, Locale } from '@/hooks/useTranslation';
import { 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Target, 
  Calendar, 
  CalendarClock,
  ChevronRight,
  ListTodo
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'targets' | 'scheduler' | 'calendar' | 'project';
  setActiveTab: (tab: 'dashboard' | 'targets' | 'scheduler' | 'calendar' | 'project') => void;
}

/**
 * Life OS Dashboard - 메인 레이아웃 컴포넌트
 * 
 * [역할]
 * 1. 전체 대시보드의 미니멀하고 모던한 구조(탑바 헤더, 좌측 사이드바, 메인 콘텐츠 영역)를 렌더링합니다.
 * 2. 상단 헤더에 Lucide 아이콘으로 정비된 3단계 테마 스위처(Light, Dark, Gravity-Free)를 탑재합니다.
 * 3. 기계적이거나 현란한 AI 템플릿 느낌을 지우기 위해 지나친 그라데이션 광원을 은은한 모노톤 그리드로 변경했습니다.
 */
export function MainLayout({ children, activeTab, setActiveTab }: MainLayoutProps) {
  const { theme, setTheme } = useThemeContext();
  const { locale, changeLocale, t } = useTranslation();

  // 로케일 버튼 스타일 처리 함수 (Zero-Gravity 디자인 준수)
  const getLocaleBtnClass = (current: Locale) => {
    const base = 'px-2 py-0.5 text-[9px] font-bold rounded-full transition-all duration-200 cursor-pointer uppercase';
    if (locale === current) {
      if (theme === 'dark') {
        return `${base} bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm`;
      }
      return `${base} bg-white text-zinc-950 border border-zinc-200 shadow-sm`;
    }
    return `${base} text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent`;
  };

  // 테마 선택에 따른 스위치 버튼 스타일 처리 함수
  const getBtnClass = (current: Theme) => {
    const base = 'px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer';
    if (theme === current) {
      if (current === 'dark') {
        return `${base} bg-zinc-800 text-zinc-100 border border-zinc-700`;
      }
      return `${base} bg-white text-zinc-950 border border-zinc-200 shadow-sm`;
    }
    return `${base} text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-500/5 border border-transparent`;
  };

  return (
    <div className="relative min-h-screen flex flex-col transition-colors duration-400">

      {/* ==========================================
         2. 상단 헤더 영역 (로고 및 테마 스위처)
         ========================================== */}
      <header className="sticky top-0 z-50 glass-panel !rounded-none border-t-0 border-x-0 bg-opacity-70 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 select-none">
            <span className="text-[15px] tracking-wide flex items-center font-sans">
              <span className="font-light text-zinc-400 dark:text-zinc-400">off</span>
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">gravity</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">.us</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 언어 스위처 */}
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-zinc-500/5 border border-zinc-500/10">
            <button type="button" onClick={() => changeLocale('ko')} className={getLocaleBtnClass('ko')} aria-label="한국어">KO</button>
            <button type="button" onClick={() => changeLocale('en')} className={getLocaleBtnClass('en')} aria-label="English">EN</button>
            <button type="button" onClick={() => changeLocale('ja')} className={getLocaleBtnClass('ja')} aria-label="日本語">JA</button>
          </div>

          {/* 테마 스위처 (이모지에서 Lucide 아이콘으로 변경) */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-500/5 border border-zinc-500/10">
            <button 
              type="button"
              onClick={() => setTheme('light')} 
              className={getBtnClass('light')}
              aria-label="라이트 모드"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('common.themeLight')}</span>
            </button>
            
            <button 
              type="button"
              onClick={() => setTheme('dark')} 
              className={getBtnClass('dark')}
              aria-label="다크 모드"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('common.themeDark')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
         3. 메인 레이아웃 본문 (사이드바 + 메인 콘텐츠)
         ========================================== */}
      <div className="flex-1 flex relative z-10">
        {/* 네비게이션 사이드바 (데스크톱 전용 미니멀 스타일) */}
        <aside className="w-64 hidden md:flex flex-col p-6 border-r border-zinc-500/10 transition-all duration-300">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer border ${
                activeTab === 'dashboard'
                  ? 'bg-blue-100/70 text-blue-700 border-blue-200/50 shadow-sm translate-x-1 dark:bg-blue-500/35 dark:text-white dark:border-blue-400/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent translate-x-0 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === 'dashboard' ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-400 dark:text-zinc-500'
                }`} />
                <span className="text-sm">{t('common.dashboard')}</span>
              </div>
              {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 opacity-80 text-blue-750 dark:text-blue-200 transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>
            
            <button
              onClick={() => setActiveTab('targets')}
              className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer border ${
                activeTab === 'targets'
                  ? 'bg-blue-100/70 text-blue-700 border-blue-200/50 shadow-sm translate-x-1 dark:bg-blue-500/35 dark:text-white dark:border-blue-400/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-850 dark:hover:text-zinc-100 border-transparent translate-x-0 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === 'targets' ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-400 dark:text-zinc-500'
                }`} />
                <span className="text-sm">{t('common.targetGoals')}</span>
              </div>
              {activeTab === 'targets' && <ChevronRight className="w-3.5 h-3.5 opacity-80 text-blue-750 dark:text-blue-200 transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>

            <button
              onClick={() => setActiveTab('project')}
              className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer border ${
                activeTab === 'project'
                  ? 'bg-blue-100/70 text-blue-700 border-blue-200/50 shadow-sm translate-x-1 dark:bg-blue-500/35 dark:text-white dark:border-blue-400/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent translate-x-0 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <ListTodo className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === 'project' ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-400 dark:text-zinc-500'
                }`} />
                <span className="text-sm">{t('project.title')}</span>
              </div>
              {activeTab === 'project' && <ChevronRight className="w-3.5 h-3.5 opacity-80 text-blue-750 dark:text-blue-200 transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>
            
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer border ${
                activeTab === 'scheduler'
                  ? 'bg-blue-100/70 text-blue-700 border-blue-200/50 shadow-sm translate-x-1 dark:bg-blue-500/35 dark:text-white dark:border-blue-400/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent translate-x-0 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarClock className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === 'scheduler' ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-400 dark:text-zinc-500'
                }`} />
                <span className="text-sm">{t('common.scheduler')}</span>
              </div>
              {activeTab === 'scheduler' && <ChevronRight className="w-3.5 h-3.5 opacity-80 text-blue-750 dark:text-blue-200 transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer border ${
                activeTab === 'calendar'
                  ? 'bg-blue-100/70 text-blue-700 border-blue-200/50 shadow-sm translate-x-1 dark:bg-blue-500/35 dark:text-white dark:border-blue-400/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/5 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent translate-x-0 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  activeTab === 'calendar' ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-400 dark:text-zinc-500'
                }`} />
                <span className="text-sm">{t('common.calendar')}</span>
              </div>
              {activeTab === 'calendar' && <ChevronRight className="w-3.5 h-3.5 opacity-80 text-blue-750 dark:text-blue-200 transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>
          </nav>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
