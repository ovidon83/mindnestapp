import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought, PotentialType } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Share2, 
  ListTodo, 
  Lightbulb,
  Calendar,
  Sparkles,
  ParkingCircle,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  ChevronDown
} from 'lucide-react';
import Navigation from './Navigation';

type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time';

const InsightsView: React.FC = () => {
  const {
    thoughts,
    actions,
    loading,
    user,
    signOut,
    setCurrentView,
  } = useGenieNotesStore();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('This Week');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    };

    if (isPeriodDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPeriodDropdownOpen]);

  // Calculate statistics based on selected period
  const stats = useMemo(() => {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (selectedPeriod) {
      case 'Today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'This Week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'This Month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'This Year':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'All Time':
        periodStart = new Date(0); // Beginning of time
        break;
      default:
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Filter thoughts for the selected period
    const periodThoughts = thoughts.filter(t => {
      const thoughtDate = new Date(t.createdAt);
      return thoughtDate >= periodStart && thoughtDate <= periodEnd;
    });

    // Filter actions for the selected period
    const periodActions = actions.filter(a => {
      const actionDate = new Date(a.createdAt);
      return actionDate >= periodStart && actionDate <= periodEnd;
    });

    // Total thoughts in period
    const totalThoughts = periodThoughts.length;

    // Potential breakdown
    const potentialCounts = {
      'Share': periodThoughts.filter(t => (t.potential || t.bestPotential) === 'Share').length,
      'Do': periodThoughts.filter(t => (t.potential || t.bestPotential) === 'Do').length,
      'Just a thought': periodThoughts.filter(t => (t.potential || t.bestPotential) === 'Just a thought').length,
    };

    // Completion rate (combining actions and todos)
    const totalActions = periodActions.length;
    const completedActions = periodActions.filter(a => a.completed).length;
    const completedTodos = periodThoughts.filter(t => t.todoData?.completed).length;
    const totalTodos = periodThoughts.filter(t => (t.potential || t.bestPotential) === 'Do').length;
    const totalCompletable = totalActions + totalTodos;
    const totalCompleted = completedActions + completedTodos;
    const completionRate = totalCompletable > 0 ? Math.round((totalCompleted / totalCompletable) * 100) : 0;

    // Calculate trend (comparing to previous period)
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date = periodStart;
    
    switch (selectedPeriod) {
      case 'Today':
        previousPeriodStart = new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'This Week':
        previousPeriodStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'This Month':
        const prevMonth = new Date(periodStart);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        previousPeriodStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
        break;
      case 'This Year':
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        previousPeriodStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const previousPeriodThoughts = thoughts.filter(t => {
      const thoughtDate = new Date(t.createdAt);
      return thoughtDate >= previousPeriodStart && thoughtDate < previousPeriodEnd;
    }).length;

    const thoughtsTrend = previousPeriodThoughts > 0 
      ? Math.round(((totalThoughts - previousPeriodThoughts) / previousPeriodThoughts) * 100)
      : totalThoughts > 0 ? 100 : 0;

    return {
      totalThoughts,
      trend: thoughtsTrend,
      potential: potentialCounts,
      completionRate,
    };
  }, [thoughts, actions, selectedPeriod]);

  // Generate GitHub-style contributions data
  const contributionsData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    // Start from 364 days ago (to get exactly 365 days including today)
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);
    
    // Group thoughts by date
    const dailyCounts: Record<string, number> = {};
    thoughts.forEach(thought => {
      const date = new Date(thought.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      const thoughtDate = new Date(dateKey);
      thoughtDate.setHours(0, 0, 0, 0);
      
      if (thoughtDate >= startDate && thoughtDate <= now) {
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    });

    // Get max count for color intensity
    const maxCount = Math.max(...Object.values(dailyCounts), 1);

    // Generate all dates in range
    const dates: Array<{ date: Date; count: number }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dates.push({
        date: new Date(currentDate),
        count: dailyCounts[dateKey] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dates, maxCount };
  }, [thoughts]);

  // Get color intensity for GitHub-style heatmap
  const getContributionColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-slate-100';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-emerald-200';
    if (intensity <= 0.5) return 'bg-emerald-400';
    if (intensity <= 0.75) return 'bg-emerald-600';
    return 'bg-emerald-700';
  };

  // Group dates by week for display (GitHub style: weeks start on Sunday)
  const weeks = useMemo(() => {
    if (contributionsData.dates.length === 0) return [];
    
    const weeksArray: Array<Array<{ date: Date; count: number; dayOfWeek: number }>> = [];
    
    // Find the first date and get its day of week
    const firstDate = new Date(contributionsData.dates[0].date);
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Start from the Sunday of the week containing the first date
    const firstSunday = new Date(firstDate);
    firstSunday.setDate(firstSunday.getDate() - firstDayOfWeek);
    firstSunday.setHours(0, 0, 0, 0);
    
    // Create a map of date strings to counts for quick lookup
    const dateCountMap = new Map<string, number>();
    contributionsData.dates.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0];
      dateCountMap.set(dateKey, item.count);
    });
    
    // Get the last date
    const lastDate = new Date(contributionsData.dates[contributionsData.dates.length - 1].date);
    const lastDayOfWeek = lastDate.getDay();
    
    // Calculate the last Sunday (end of the last week)
    const lastSunday = new Date(lastDate);
    lastSunday.setDate(lastSunday.getDate() + (6 - lastDayOfWeek));
    lastSunday.setHours(23, 59, 59, 999);
    
    // Generate all weeks from first Sunday to last Sunday
    let currentDate = new Date(firstSunday);
    let currentWeek: Array<{ date: Date; count: number; dayOfWeek: number }> = [];
    
    while (currentDate <= lastSunday) {
      const dayOfWeek = currentDate.getDay();
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = dateCountMap.get(dateKey) || 0;
      
      currentWeek.push({
        date: new Date(currentDate),
        count,
        dayOfWeek,
      });
      
      // If it's Saturday (6), we've completed a week
      if (dayOfWeek === 6) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add the last incomplete week if it exists
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }
    
    return weeksArray;
  }, [contributionsData]);

  // Get month labels for the top
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = week.find(d => d.count >= 0) || week[0];
        const month = firstDay.date.getMonth();
        
        // Only add label if it's the first week of a new month
        if (month !== lastMonth) {
          labels.push({
            month: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-white">
      <Navigation
        currentView="insights"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Period Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Insights</h1>
                <p className="text-slate-600 mt-1">Your thought patterns and productivity metrics</p>
              </div>
            </div>
            
            {/* Period Selector Dropdown */}
            <div className="relative" ref={periodDropdownRef}>
              <button
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>{selectedPeriod}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isPeriodDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg border-2 border-slate-200 shadow-xl z-50 min-w-[180px] overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {(['Today', 'This Week', 'This Month', 'This Year', 'All Time'] as Period[]).map(period => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors rounded-lg flex items-center gap-2 ${
                          selectedPeriod === period
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Calendar className={`w-4 h-4 ${selectedPeriod === period ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{period}</span>
                        {selectedPeriod === period && (
                          <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            label="Total Thoughts"
            value={stats.totalThoughts}
            icon={<Activity className="w-5 h-5" />}
            color="from-indigo-500 to-purple-500"
            trend={stats.trend}
          />
          <StatCard
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="from-emerald-500 to-teal-500"
          />
        </div>

        {/* Potential Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Potential Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PotentialCard
              type="Share"
              count={stats.potential.Share}
              total={stats.totalThoughts}
              icon={<Share2 className="w-5 h-5" />}
              color="from-pink-500 to-rose-500"
            />
            <PotentialCard
              type="Do"
              count={stats.potential.Do}
              total={stats.totalThoughts}
              icon={<ListTodo className="w-5 h-5" />}
              color="from-teal-500 to-cyan-500"
            />
            <PotentialCard
              type="Just a thought"
              count={stats.potential['Just a thought']}
              total={stats.totalThoughts}
              icon={<Lightbulb className="w-5 h-5" />}
              color="from-slate-500 to-gray-500"
            />
          </div>
        </div>

        {/* GitHub-Style Activity Graph */}
        <div className="mb-8 bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Activity</h2>
            <div className="text-sm text-slate-600">
              {contributionsData.dates.filter(d => d.count > 0).length} days with thoughts
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="flex gap-1 items-start" style={{ minWidth: 'max-content' }}>
              {/* Day labels on the left */}
              <div className="flex flex-col gap-1 mr-2 pt-7">
                {['Mon', 'Wed', 'Fri'].map(day => (
                  <div key={day} className="text-xs text-slate-500 h-3.5 leading-none">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Month labels on top */}
              <div className="flex flex-col">
                <div className="flex gap-1 mb-1 h-6 relative">
                  {weeks.map((week, weekIndex) => {
                    const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
                    return (
                      <div key={weekIndex} className="w-3.5 relative">
                        {monthLabel && (
                          <div className="absolute left-0 top-0 text-xs text-slate-500 whitespace-nowrap">
                            {monthLabel.month}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Weeks grid */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((item, dayIndex) => {
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-3.5 h-3.5 rounded-sm ${getContributionColor(item.count, contributionsData.maxCount)} transition-all hover:ring-2 hover:ring-slate-400 cursor-pointer`}
                            title={`${item.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}: ${item.count} ${item.count === 1 ? 'thought' : 'thoughts'}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-100"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-700"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, trend }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-lg text-white`}>
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
};

// Potential Card Component
interface PotentialCardProps {
  type: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}

const PotentialCard: React.FC<PotentialCardProps> = ({ type, count, total, icon, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-lg text-white`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">{count}</div>
          <div className="text-sm text-slate-600">{percentage}%</div>
        </div>
      </div>
      <div className="text-sm font-medium text-slate-800">{type}</div>
      <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
        <div
          className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default InsightsView;
