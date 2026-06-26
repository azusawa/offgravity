'use client';

import React, { useState } from 'react';
import { useTargetGoals } from '@/hooks/useTargetGoals';
import { useTranslation } from '@/hooks/useTranslation';
import { GoalPeriod, GoalCategory } from '@/domain/entities/TargetGoal';
import { 
  Plus, 
  Trash2, 
  Check, 
  TrendingUp
} from 'lucide-react';

/**
 * Life OS Dashboard - 목표 설정 관리 뷰 컴포넌트
 * 
 * [역할]
 * 1. 사용자의 주간(Weekly), 연간(Yearly), 평생(Lifetime) 목표 목록을 탭 구조로 제공합니다.
 * 2. 신규 목표를 카테고리별로 기입하는 미니멀 폼(Form) 양식을 구성합니다.
 * 3. 각 목표의 진척도를 슬라이더 형태로 직관적으로 수정하고 완료 상태를 토글합니다.
 * 4. 이모지 대신 Lucide React의 얇은 픽셀 벡터 아이콘과 모노톤 보더를 사용하여 기계적인 느낌이 나지 않도록 마감했습니다.
 */
export default function TargetGoalsView() {
  const { t } = useTranslation();
  const { 
    goals, 
    loading, 
    mounted, 
    addGoal, 
    updateGoalProgress, 
    toggleGoalCompletion, 
    deleteGoal 
  } = useTargetGoals();

  // --- [로컬 UI 상태] ---
  const [activeTab, setActiveTab] = useState<GoalPeriod>('weekly');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('work');
  const [errorMsg, setErrorMsg] = useState('');

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        {t('target.loading')}
      </div>
    );
  }

  // 목표 추가 서브밋 핸들러
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newTitle.trim()) {
      setErrorMsg(t('target.titleRequired'));
      return;
    }

    try {
      await addGoal(newTitle, activeTab, newCategory);
      setNewTitle(''); // 입력 폼 비우기
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('target.errorAddGoal'));
      }
    }
  };

  // 카테고리 텍스트 다국어 매퍼
  const getCategoryLabel = (cat: GoalCategory) => {
    switch (cat) {
      case 'work': return t('calendar.categoryWork');
      case 'life': return t('calendar.categoryLife');
      case 'health': return t('calendar.categoryHealth');
      case 'growth': return t('calendar.categoryGrowth');
    }
  };

  // 카테고리별 부드러운 파스텔 톤 색상 클래스 매퍼 (라이트 한층 더 연하게, 다크 최고도 밝게 튜닝)
  const getCategoryColorClass = (cat: GoalCategory) => {
    switch (cat) {
      case 'work': // 파스텔 블루
        return 'bg-blue-50/20 text-blue-500/60 border-blue-100/20 dark:bg-blue-950/50 dark:text-blue-100 border-transparent dark:border-blue-900/20';
      case 'life': // 파스텔 그린
        return 'bg-emerald-50/20 text-emerald-500/60 border-emerald-100/20 dark:bg-emerald-950/50 dark:text-emerald-100 border-transparent dark:border-emerald-900/20';
      case 'health': // 파스텔 로즈
        return 'bg-rose-50/20 text-rose-500/60 border-rose-100/20 dark:bg-rose-950/50 dark:text-rose-100 border-transparent dark:border-rose-900/20';
      case 'growth': // 파스텔 퍼플
        return 'bg-purple-50/20 text-purple-500/60 border-purple-100/20 dark:bg-purple-950/50 dark:text-purple-100 border-transparent dark:border-purple-900/20';
    }
  };

  // 카테고리별 슬라이더 악센트 컬러 매퍼
  const getSliderAccentClass = (cat: GoalCategory) => {
    switch (cat) {
      case 'work': return 'accent-blue-500 dark:accent-blue-400';
      case 'life': return 'accent-emerald-500 dark:accent-emerald-400';
      case 'health': return 'accent-rose-500 dark:accent-rose-400';
      case 'growth': return 'accent-purple-500 dark:accent-purple-400';
    }
  };

  // 카테고리별 완료 체크박스 색상 매퍼 (다크 모드 가시성 향상)
  const getCheckboxClass = (goalItem: typeof goals[0]) => {
    if (goalItem.isCompleted) {
      switch (goalItem.category) {
        case 'work': return 'bg-blue-500 border-transparent text-white dark:bg-blue-400 dark:text-zinc-900';
        case 'life': return 'bg-emerald-500 border-transparent text-white dark:bg-emerald-400 dark:text-zinc-900';
        case 'health': return 'bg-rose-500 border-transparent text-white dark:bg-rose-400 dark:text-zinc-900';
        case 'growth': return 'bg-purple-500 border-transparent text-white dark:bg-purple-400 dark:text-zinc-900';
      }
    }
    return 'border-zinc-300 dark:border-zinc-700 text-transparent hover:border-zinc-400 dark:hover:border-zinc-500';
  };

  // 탭 필터링된 목표 목록
  const filteredGoals = goals.filter((g) => g.period === activeTab);

  return (
    <div className="space-y-8 relative animate-fade-in-up">
      {/* 1. 상단 탭 스위처 및 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-500/10 pb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'weekly' 
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' 
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-500/5'
            }`}
          >
            {t('target.weeklyGoal')}
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'yearly' 
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' 
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-500/5'
            }`}
          >
            {t('target.yearlyGoal')}
          </button>
          <button
            onClick={() => setActiveTab('lifetime')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'lifetime' 
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' 
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-500/5'
            }`}
          >
            {t('target.lifeGoal')}
          </button>
        </div>
      </div>

      {/* 2. 신규 목표 추가 입력 폼 */}
      <form onSubmit={handleAddGoal} className="glass-panel p-5 space-y-4 max-w-xl">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-zinc-550 animate-spin [animation-duration:8s]" />
          <span>{t('target.titleAdd')}</span>
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('target.addGoalPlaceholder')}
            className="flex-1 bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-150 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 placeholder-zinc-400"
          />
          
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
            className="bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
          >
            <option value="work">{t('calendar.categoryWork')}</option>
            <option value="life">{t('calendar.categoryLife')}</option>
            <option value="health">{t('calendar.categoryHealth')}</option>
            <option value="growth">{t('calendar.categoryGrowth')}</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {t('target.buttonAdd')}
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
        )}
      </form>

      {/* 3. 필터링된 목표 카드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-zinc-400 border border-dashed border-zinc-500/10 rounded-xl">
            {t('target.noGoals')}
          </div>
        ) : (
          filteredGoals.map((goal, idx) => {
            // 입체감을 부여하기 위해 float 애니메이션을 카드 인덱스에 따라 다르게 할당
            const floatClass = idx % 3 === 0 
              ? 'animate-float-slow' 
              : idx % 3 === 1 
                ? 'animate-float-medium' 
                : 'animate-float-fast';

            return (
              <div 
                key={goal.id} 
                className={`group glass-panel p-5 flex flex-col justify-between min-h-[170px] ${floatClass} ${
                  goal.isCompleted ? 'opacity-65' : ''
                }`}
              >
                {/* 상단: 카테고리 뱃지 및 삭제 버튼 */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-transform duration-300 group-hover:scale-105 ${getCategoryColorClass(goal.category)}`}>
                    {getCategoryLabel(goal.category)}
                  </span>
                  
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/5 transition-transform duration-200 hover:scale-115 hover:rotate-6 active:scale-90 cursor-pointer"
                    aria-label={t('target.deleteGoal')}
                    title={t('target.deleteGoal')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 중단: 제목 */}
                <div className="flex-1 flex items-center mb-4">
                  <button
                    onClick={() => toggleGoalCompletion(goal.id)}
                    className={`mr-3 p-1 rounded-full border transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center ${getCheckboxClass(goal)}`}
                    aria-label={t('target.toggleComplete')}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <span className={`text-[15px] leading-snug transition-colors duration-200 ${
                    goal.isCompleted 
                      ? 'line-through text-zinc-400 dark:text-zinc-500' 
                      : 'text-zinc-500 dark:text-white font-medium dark:font-bold'
                  }`}>
                    {goal.title}
                  </span>
                </div>

                {/* 하단: 진척도 조절 슬라이더 */}
                <div className="space-y-2 border-t border-zinc-500/10 pt-3">
                  <div className="flex justify-between items-center text-xs text-zinc-400 dark:text-zinc-300 font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-0.5" />
                      <span>{t('target.progress')}</span>
                    </span>
                    <span>{goal.progress}%</span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value, 10))}
                    className={`w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer transition-all duration-300 ${getSliderAccentClass(goal.category)}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
