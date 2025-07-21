import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Brain,
  Lightbulb,
  CheckCircle,
  FileText,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Search,
  Plus,
  Sparkles,
  Activity,
  Coffee,
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

interface DashboardStats {
  totalThoughts: number;
  tasksCompleted: number;
  tasksPending: number;
  ideasCount: number;
  projectsActive: number;
  journalEntries: number;
  productivityScore: number;
  focusAreas: string[];
}

interface TodayInsights {
  focusAreas: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    items: string[];
    estimatedTime: string;
  }>;
  suggestedTasks: Array<{
    content: string;
    priority: 'low' | 'medium' | 'high';
    reason: string;
    energyLevel: 'low' | 'medium' | 'high';
  }>;
  insights: string[];
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energyLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export const DashboardView: React.FC = () => {
  const { thoughts, randomThoughts, todos, ideas, projects, journalEntries } = useMindnestStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayInsights, setTodayInsights] = useState<TodayInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    calculateStats();
    generateTodayInsights();
  }, [thoughts, randomThoughts, todos, ideas, projects, journalEntries]);

  const calculateStats = () => {
    const completedTasks = todos.filter(todo => todo.completed).length;
    const pendingTasks = todos.filter(todo => !todo.completed).length;
    const activeProjects = projects.filter(project => 
      ['planning', 'in-progress'].includes(project.status)
    ).length;
    
    const productivityScore = Math.round(
      (completedTasks / Math.max(todos.length, 1)) * 100
    );

    const focusAreas = ideas
      .filter(idea => idea.potential === 'high')
      .slice(0, 3)
      .map(idea => idea.title);

    setStats({
      totalThoughts: thoughts.length + randomThoughts.length,
      tasksCompleted: completedTasks,
      tasksPending: pendingTasks,
      ideasCount: ideas.length,
      projectsActive: activeProjects,
      journalEntries: journalEntries.length,
      productivityScore,
      focusAreas,
    });
  };

  const generateTodayInsights = async () => {
    setIsLoading(true);
    try {
      const allThoughts = [...thoughts, ...randomThoughts];
      const result = await AIService.generateTodayView(
        allThoughts.slice(-10), // Recent thoughts
        todos.filter(t => !t.completed), // Pending tasks
        ideas.filter(i => i.status === 'concept'), // New ideas
        projects.filter(p => ['planning', 'in-progress'].includes(p.status)) // Active projects
      );
      
      if (result.success && result.data) {
        setTodayInsights(result.data);
      }
    } catch (error) {
      console.error('Failed to generate today insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };



  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'high': return <Zap className="text-yellow-500" />;
      case 'medium': return <Activity className="text-blue-500" />;
      case 'low': return <Coffee className="text-gray-500" />;
      default: return <Activity className="text-gray-500" />;
    }
  };



  const allThoughts = [...thoughts, ...randomThoughts];
  const recentThoughts = allThoughts.slice(-5);
  const urgentTasks = todos.filter(todo => 
    !todo.completed && (todo.priority === 'high' || todo.dueDate)
  ).slice(0, 3);
  const highPotentialIdeas = ideas.filter(idea => idea.potential === 'high').slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-gray-600">Your thoughts, organized and enhanced</p>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="random">Random Thoughts</option>
              <option value="todo">Tasks</option>
              <option value="idea">Ideas</option>
              <option value="project">Projects</option>
              <option value="note">Notes</option>
              <option value="journal">Journal</option>
            </select>
          </div>
        </div>

        {/* Mindfulness Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Breathing Card */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">💨</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Breathing</h3>
            <p className="text-sm text-blue-700 mb-2">Center yourself with a 5-min practice</p>
            {/* TODO: Add streak/progress if tracked */}
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow" onClick={() => window.location.hash = '#/journal?tab=breathing'}>
              Start Breathing
            </button>
          </div>
          {/* Meditation Card */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🧘‍♂️</span>
            </div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">Meditation</h3>
            <p className="text-sm text-purple-700 mb-2">Find peace with a 5-min meditation</p>
            {/* TODO: Add streak/progress if tracked */}
            <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow" onClick={() => window.location.hash = '#/journal?tab=meditation'}>
              Start Meditation
            </button>
          </div>
          {/* Journaling Card */}
          <div className="bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">📓</span>
            </div>
            <h3 className="text-lg font-semibold text-amber-900 mb-1">Journaling</h3>
            <p className="text-sm text-amber-700 mb-2">Reflect and grow with daily journaling</p>
            {/* TODO: Add streak/progress if tracked */}
            <button className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium shadow" onClick={() => window.location.hash = '#/journal?tab=journal'}>
              New Journal Entry
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalThoughts}</p>
                  <p className="text-xs text-gray-500">Total Thoughts</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.tasksCompleted}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.tasksPending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lightbulb size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.ideasCount}</p>
                  <p className="text-xs text-gray-500">Ideas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.projectsActive}</p>
                  <p className="text-xs text-gray-500">Active Projects</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.journalEntries}</p>
                  <p className="text-xs text-gray-500">Journal Entries</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.productivityScore}%</p>
                  <p className="text-xs text-gray-500">Productivity</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Focus */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">Today's Focus</h2>
                  <p className="text-sm text-gray-600">AI-powered insights for your day</p>
                </div>
              </div>

              {todayInsights ? (
                <div className="space-y-6">
                  {/* Focus Areas */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Focus Areas</h3>
                    <div className="space-y-3">
                      {todayInsights.focusAreas.map((area, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{area.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(area.priority)}`}>
                              {area.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>⏱️ {area.estimatedTime}</span>
                            <span>📋 {area.items.length} items</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Tasks */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Tasks</h3>
                    <div className="space-y-3">
                      {todayInsights.suggestedTasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {getEnergyIcon(task.energyLevel)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{task.content}</p>
                            <p className="text-xs text-gray-600">{task.reason}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
                    <div className="space-y-2">
                      {todayInsights.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <Brain size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-900">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                    <div className="space-y-2">
                      {todayInsights.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Star size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-900">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Generating personalized insights...</p>
                </div>
              )}
            </div>

            {/* Recent Thoughts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Recent Thoughts</h2>
                    <p className="text-sm text-gray-600">Your latest captures</p>
                  </div>
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentThoughts.map((thought) => {
                  const isThought = 'type' in thought;
                  const thoughtType = isThought ? thought.type : 'random';
                  const timestamp = isThought ? thought.timestamp : thought.createdAt;
                  const tags = isThought ? thought.tags : [];
                  
                  return (
                    <div key={thought.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {thoughtType === 'todo' && <CheckCircle size={16} className="text-gray-600" />}
                        {thoughtType === 'idea' && <Lightbulb size={16} className="text-gray-600" />}
                        {thoughtType === 'project' && <Target size={16} className="text-gray-600" />}
                        {thoughtType === 'note' && <FileText size={16} className="text-gray-600" />}
                        {thoughtType === 'journal' && <BookOpen size={16} className="text-gray-600" />}
                        {thoughtType === 'random' && <Brain size={16} className="text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{thought.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {format(new Date(timestamp), 'MMM d, h:mm a')}
                          </span>
                          {tags && tags.length > 0 && (
                            <div className="flex gap-1">
                              {tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-200 text-xs text-gray-600 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <Plus size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Capture Thought</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <CheckCircle size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Add Task</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <Lightbulb size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">New Idea</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <BookOpen size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Journal Entry</span>
                </button>
              </div>
            </div>

            {/* Urgent Tasks */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Urgent Tasks</h3>
              <div className="space-y-3">
                {urgentTasks.length > 0 ? (
                  urgentTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <CheckCircle size={16} className="text-red-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.content}</p>
                        {task.dueDate && (
                          <p className="text-xs text-red-600">
                            Due {format(new Date(task.dueDate), 'MMM d')}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No urgent tasks</p>
                )}
              </div>
            </div>

            {/* High Potential Ideas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">High Potential Ideas</h3>
              <div className="space-y-3">
                {highPotentialIdeas.length > 0 ? (
                  highPotentialIdeas.map((idea) => (
                    <div key={idea.id} className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{idea.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{idea.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-200 text-xs text-purple-700 rounded-full">
                          {idea.category}
                        </span>
                        <span className="px-2 py-1 bg-yellow-200 text-xs text-yellow-700 rounded-full">
                          {idea.potential} potential
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No high potential ideas</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 