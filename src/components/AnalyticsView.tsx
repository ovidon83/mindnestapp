import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, CheckCircle, Lightbulb, MessageCircle, BookOpen, Target, Clock } from 'lucide-react';
import { useMindnestStore } from '../store';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  const { todos, thoughts } = useMindnestStore();

  const analytics = useMemo(() => {
    const now = new Date();
    const filterDate = (date: Date | string) => {
      const d = date instanceof Date ? date : new Date(date);
      switch (timeRange) {
        case '7d':
          return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return d >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'all':
          return true;
        default:
          return true;
      }
    };

    const filteredTodos = todos.filter(todo => filterDate(todo.createdAt));
    const filteredThoughts = thoughts.filter(thought => filterDate(thought.timestamp));

    // Task Analytics
    const completedTasks = filteredTodos.filter(todo => todo.completed);
    const incompleteTasks = filteredTodos.filter(todo => !todo.completed);
    const completionRate = filteredTodos.length > 0 ? (completedTasks.length / filteredTodos.length) * 100 : 0;

    // Priority Distribution
    const priorityStats = {
      high: filteredTodos.filter(todo => todo.priority === 'high').length,
      medium: filteredTodos.filter(todo => todo.priority === 'medium').length,
      low: filteredTodos.filter(todo => todo.priority === 'low').length,
    };

    // Status Distribution
    const statusStats = {
      'To Do': filteredTodos.filter(todo => todo.status === 'To Do').length,
      'In Progress': filteredTodos.filter(todo => todo.status === 'In Progress').length,
      'Blocked': filteredTodos.filter(todo => todo.status === 'Blocked').length,
      'Done': filteredTodos.filter(todo => todo.status === 'Done').length,
    };

    // Thought Analytics
    const thoughtsByType = {
      ideas: filteredThoughts.filter(thought => thought.type === 'idea').length,
      journal: filteredThoughts.filter(thought => thought.type === 'journal').length,
      random: filteredThoughts.filter(thought => thought.type === 'random').length,
    };

    // Daily Activity
    const dailyActivity = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      
      const dayTodos = todos.filter(todo => {
        const todoDate = todo.createdAt instanceof Date ? todo.createdAt : new Date(todo.createdAt);
        return todoDate.toDateString() === dateStr;
      }).length;
      
      const dayThoughts = thoughts.filter(thought => {
        const thoughtDate = thought.timestamp instanceof Date ? thought.timestamp : new Date(thought.timestamp);
        return thoughtDate.toDateString() === dateStr;
      }).length;

      dailyActivity.push({
        date: dateStr,
        todos: dayTodos,
        thoughts: dayThoughts,
        total: dayTodos + dayThoughts
      });
    }

    // Productivity Insights
    const avgTasksPerDay = filteredTodos.length / Math.max(days, 1);
    const avgThoughtsPerDay = filteredThoughts.length / Math.max(days, 1);
    
    // Most productive day
    const mostProductiveDay = dailyActivity.reduce((max, day) => 
      day.total > max.total ? day : max, dailyActivity[0] || { date: '', total: 0 }
    );

    return {
      totalTasks: filteredTodos.length,
      completedTasks: completedTasks.length,
      incompleteTasks: incompleteTasks.length,
      completionRate,
      priorityStats,
      statusStats,
      totalThoughts: filteredThoughts.length,
      thoughtsByType,
      dailyActivity,
      avgTasksPerDay,
      avgThoughtsPerDay,
      mostProductiveDay
    };
  }, [todos, thoughts, timeRange]);

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: React.ComponentType<any>; 
    color: string;
  }> = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ 
    label, value, total, color 
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
          style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="text-rose-600" size={36} />
            Analytics
          </h1>
          <p className="text-gray-600">
            Insights into your productivity patterns and thinking habits
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: '7d' as TimeRange, label: 'Last 7 days' },
              { key: '30d' as TimeRange, label: 'Last 30 days' },
              { key: '90d' as TimeRange, label: 'Last 90 days' },
              { key: 'all' as TimeRange, label: 'All time' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={analytics.totalTasks}
            subtitle={`${Math.round(analytics.avgTasksPerDay * 10) / 10} per day`}
            icon={Target}
            color="blue"
          />
          <StatCard
            title="Completion Rate"
            value={`${Math.round(analytics.completionRate)}%`}
            subtitle={`${analytics.completedTasks}/${analytics.totalTasks} completed`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Thoughts"
            value={analytics.totalThoughts}
            subtitle={`${Math.round(analytics.avgThoughtsPerDay * 10) / 10} per day`}
            icon={MessageCircle}
            color="purple"
          />
          <StatCard
            title="Most Productive Day"
            value={analytics.mostProductiveDay.total}
            subtitle={new Date(analytics.mostProductiveDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-blue-600" />
              Task Status Distribution
            </h3>
            <div className="space-y-4">
              <ProgressBar label="To Do" value={analytics.statusStats['To Do']} total={analytics.totalTasks} color="blue" />
              <ProgressBar label="In Progress" value={analytics.statusStats['In Progress']} total={analytics.totalTasks} color="yellow" />
              <ProgressBar label="Blocked" value={analytics.statusStats['Blocked']} total={analytics.totalTasks} color="red" />
              <ProgressBar label="Done" value={analytics.statusStats['Done']} total={analytics.totalTasks} color="green" />
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-red-600" />
              Priority Distribution
            </h3>
            <div className="space-y-4">
              <ProgressBar label="High Priority" value={analytics.priorityStats.high} total={analytics.totalTasks} color="red" />
              <ProgressBar label="Medium Priority" value={analytics.priorityStats.medium} total={analytics.totalTasks} color="yellow" />
              <ProgressBar label="Low Priority" value={analytics.priorityStats.low} total={analytics.totalTasks} color="green" />
            </div>
          </div>
        </div>

        {/* Thoughts Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-purple-600" />
              Thoughts by Type
            </h3>
            <div className="space-y-4">
              <ProgressBar label="Ideas" value={analytics.thoughtsByType.ideas} total={analytics.totalThoughts} color="yellow" />
              <ProgressBar label="Journal Entries" value={analytics.thoughtsByType.journal} total={analytics.totalThoughts} color="green" />
              <ProgressBar label="Random Thoughts" value={analytics.thoughtsByType.random} total={analytics.totalThoughts} color="purple" />
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Daily Activity ({timeRange})
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Less</span>
                <span>More</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {analytics.dailyActivity.slice(-49).map((day, index) => {
                  const intensity = Math.min(day.total / 5, 1); // Normalize to 0-1
                  return (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-sm ${
                        intensity === 0 ? 'bg-gray-100' :
                        intensity < 0.25 ? 'bg-green-200' :
                        intensity < 0.5 ? 'bg-green-400' :
                        intensity < 0.75 ? 'bg-green-600' :
                        'bg-green-800'
                      }`}
                      title={`${new Date(day.date).toLocaleDateString()}: ${day.total} items`}
                    />
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Each square represents a day's activity
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-yellow-600" />
            Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.completionRate < 50 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">📈 Completion Rate</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your task completion rate is {Math.round(analytics.completionRate)}%. 
                  Consider breaking down large tasks into smaller, manageable steps.
                </p>
              </div>
            )}
            
            {analytics.priorityStats.high > analytics.totalTasks * 0.4 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">🔥 High Priority Overload</p>
                <p className="text-xs text-red-700 mt-1">
                  {Math.round((analytics.priorityStats.high / analytics.totalTasks) * 100)}% of your tasks are high priority. 
                  Consider re-evaluating priorities to maintain focus.
                </p>
              </div>
            )}
            
            {analytics.avgThoughtsPerDay > 5 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-800">🧠 Active Thinker</p>
                <p className="text-xs text-purple-700 mt-1">
                  You're capturing {Math.round(analytics.avgThoughtsPerDay * 10) / 10} thoughts per day! 
                  Great job maintaining mental clarity through regular brain dumps.
                </p>
              </div>
            )}
            
            {analytics.thoughtsByType.ideas > analytics.thoughtsByType.journal && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">💡 Idea Generator</p>
                <p className="text-xs text-blue-700 mt-1">
                  You're generating more ideas than journal entries. 
                  Consider developing some of your best ideas into actionable tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};