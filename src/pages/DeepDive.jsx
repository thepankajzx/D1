import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useMemo } from 'react';
import Icon from '../components/Icon';
import TargetTimeTemplate from '../components/DeepDive/TargetTimeTemplate';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function DeepDive() {
  const query = useQuery();
  const habitId = query.get('habitId');
  const navigate = useNavigate();
  
  const { habits, allSummaries } = useData();
  
  const habit = useMemo(() => {
    if (!habits || !habitId) return null;
    return habits.find(h => h.id === habitId);
  }, [habits, habitId]);

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Icon name="error_outline" className="text-4xl text-on-surface-variant mb-4" />
        <h2 className="text-xl font-bold text-on-surface">Habit Not Found</h2>
        <p className="text-on-surface-variant mt-2 mb-6">This habit may have been deleted.</p>
        <button onClick={() => navigate('/analytics')} className="btn-primary">
          Back to Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6">
      {/* 1. TOP NAVIGATION (Shared) */}
      <nav className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
        <button 
          onClick={() => navigate('/analytics')}
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface w-full md:w-auto justify-start transition-colors"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to Analytics
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Icon name="insights" className="text-primary text-[24px]" />
            <h1 className="text-xl font-bold text-on-surface">Habit Deep Dive</h1>
          </div>
          <p className="text-sm text-on-surface-variant">Detailed insights and patterns for your top habits</p>
        </div>

        {/* Dummy Date Selector for now */}
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-outline-variant bg-surface rounded-lg shadow-sm hover:bg-surface-variant w-full md:w-auto justify-center transition-colors">
          <Icon name="calendar_today" className="text-on-surface-variant text-[16px]" />
          Last 30 Days
          <Icon name="arrow_drop_down" className="text-on-surface-variant text-[18px]" />
        </button>
      </nav>

      {/* RESOLVE TEMPLATE */}
      {habit.scoringType === 'time' && (
        <TargetTimeTemplate habit={habit} habits={habits} allSummaries={allSummaries} />
      )}
      
      {habit.scoringType !== 'time' && (
        <div className="bg-surface-variant/30 rounded-2xl p-12 text-center border border-outline-variant/50">
          <Icon name="construction" className="text-4xl text-primary mb-4" />
          <h3 className="text-xl font-bold text-on-surface mb-2">Template Coming Soon</h3>
          <p className="text-on-surface-variant">
            The Deep Dive template for {habit.scoringType} habits is currently under construction.
          </p>
        </div>
      )}
    </div>
  );
}
