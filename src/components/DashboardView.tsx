import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Target, 
  Lightbulb, 
  FileText, 
  BookOpen, 
  FolderOpen,
  Zap,
  TrendingUp,
  BarChart3,
  Hash,
  Plus,
  ArrowRight,
  Brain,
  Sparkles
} from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

// Helper function to check if a date is today
const isToday = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(Date.parse(date)) : date;
  return d.toDateString() === new Date().toDateString();
};

// Helper function to check if a date is overdue
const isOverdue = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(Date.parse(date)) : date;
  return d < new Date() && !isToday(d);
};

// Helper function to format dates
const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(Date.parse(date)) : date;
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const DashboardView: React.FC = () => {
  const [todayInsights, setTodayInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  const { 
    thoughts, 
    todos, 
    ideas, 
    projects, 
    journalEntries,
    randomThoughts 
  } = useMindnestStore();

  // Get today's data
  const todayTodos = todos.filter(todo => isToday(todo.dueDate) && !todo.completed);
  const overdueTodos = todos.filter(todo => isOverdue(todo.dueDate) && !todo.completed);
  const todayThoughts = thoughts.filter(thought => isToday(thought.timestamp));
  const todayJournalEntries = journalEntries.filter(entry => isToday(entry.date));
  const recentIdeas = ideas.slice(0, 3);
  const activeProjects = projects.filter(project => project.status !== 'completed').slice(0, 3);

  // Calculate statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const totalThoughts = thoughts.length;
  const totalIdeas = ideas.length;
  const totalProjects = projects.length;

  useEffect(() => {
    const generateTodayInsights = async () => {
      setIsLoadingInsights(true);
      try {
        const result = await AIService.generateTodayView(
          todayThoughts,
          todayTodos,
          recentIdeas,
          activeProjects
        );
        
        if (result.success && result.data) {
          setTodayInsights(result.data);
        }
      } catch (error) {
        console.error('Error generating today insights:', error);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    if (todayThoughts.length > 0 || todayTodos.length > 0) {
      generateTodayInsights();
    }
  }, [todayThoughts, todayTodos, recentIdeas, activeProjects]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Today's Dashboard</h1>
          <p className="text-gray-600 font-medium">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-xs text-green-600">+{completedTasks} completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{todayTodos.length}</p>
                <p className="text-xs text-red-600">{overdueTodos.length} overdue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Brain size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Thoughts</p>
                <p className="text-3xl font-bold text-gray-900">{totalThoughts}</p>
                <p className="text-xs text-blue-600">+{todayThoughts.length} today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Lightbulb size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Ideas & Projects</p>
                <p className="text-3xl font-bold text-gray-900">{totalIdeas + totalProjects}</p>
                <p className="text-xs text-purple-600">{activeProjects.length} active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Focus */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Zap size={28} className="text-blue-600" />
                  Today's Focus
                </h2>
                {isLoadingInsights && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Generating insights...</span>
                  </div>
                )}
              </div>

              {todayInsights ? (
                <div className="space-y-6">
                  {/* Focus Areas */}
                  {todayInsights.focusAreas && todayInsights.focusAreas.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Focus Areas</h3>
                      <div className="space-y-3">
                        {todayInsights.focusAreas.map((area: any, index: number) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{area.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(area.priority)}`}>
                                {getPriorityIcon(area.priority)} {area.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{area.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>⏱️ {area.estimatedTime}</span>
                              <div className="flex gap-1">
                                {area.items.map((item: string, itemIndex: number) => (
                                  <span key={itemIndex} className="px-2 py-1 bg-white rounded-full border border-blue-200">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Tasks */}
                  {todayInsights.suggestedTasks && todayInsights.suggestedTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Suggested Tasks</h3>
                      <div className="space-y-2">
                        {todayInsights.suggestedTasks.map((task: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-green-600" />
                              <span className="text-sm font-medium text-gray-900">{task.content}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {getPriorityIcon(task.priority)} {task.priority}
                              </span>
                              <span className="text-xs text-gray-500">⚡ {task.energyLevel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {todayInsights.insights && todayInsights.insights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Insights</h3>
                      <div className="space-y-2">
                        {todayInsights.insights.map((insight: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <Sparkles size={16} className="text-purple-600 mt-0.5" />
                            <p className="text-sm text-gray-800">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {todayInsights.recommendations && todayInsights.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
                      <div className="space-y-2">
                        {todayInsights.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                            <TrendingUp size={16} className="text-green-600 mt-0.5" />
                            <p className="text-sm text-gray-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Add some thoughts or tasks to get personalized insights for today!</p>
                </div>
              )}
            </div>

            {/* Today's Tasks */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Calendar size={28} className="text-green-600" />
                Today's Tasks
                <span className="text-lg text-gray-500">({todayTodos.length})</span>
              </h2>

              {todayTodos.length > 0 ? (
                <div className="space-y-3">
                  {todayTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-green-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{todo.content}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                              {getPriorityIcon(todo.priority)} {todo.priority}
                            </span>
                            {todo.tags && todo.tags.length > 0 && (
                              <div className="flex gap-1">
                                {todo.tags.slice(0, 2).map((tag: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                                    <Hash size={10} />
                                    {tag}
                                  </span>
                                ))}
                                {todo.tags.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    +{todo.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No tasks scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Thoughts */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain size={20} className="text-blue-600" />
                Recent Thoughts
              </h3>
              
              {todayThoughts.length > 0 ? (
                <div className="space-y-3">
                  {todayThoughts.slice(0, 3).map((thought) => (
                    <div key={thought.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800 mb-2">{thought.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{thought.type}</span>
                        {thought.tags && thought.tags.length > 0 && (
                          <div className="flex gap-1">
                            {thought.tags.slice(0, 2).map((tag: string, index: number) => (
                              <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No thoughts captured today</p>
              )}
            </div>

            {/* Active Projects */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen size={20} className="text-purple-600" />
                Active Projects
              </h3>
              
              {activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{project.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="capitalize">{project.status}</span>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 2).map((tag: string, index: number) => (
                              <span key={index} className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No active projects</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} className="text-gray-600" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Add Today's Task</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Lightbulb size={16} className="text-yellow-600" />
                    <span className="text-sm font-medium text-gray-900">Capture Thought</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Journal Entry</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">New Project</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 