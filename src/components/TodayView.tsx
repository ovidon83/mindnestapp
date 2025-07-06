import { useState, useMemo } from 'react';
import { 
  Brain, 
  CheckSquare,
  Plus,
  Play,
  Pause,
  Clock,
  Target,
  Lightbulb,
  Heart,
  Sun,
  Coffee,
  Award,
  ArrowRight,
  Square,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { DailyData, Task, Project, DayOfWeek } from '../types';
import MarkdownEditor from './MarkdownEditor';
import { AIService, ProductivityInsight } from '../utils/openai';

interface TodayViewProps {
  dailyData: DailyData[];
  tasks: Task[];
  projects: Project[];
  selectedDate: Date;
  activeSection: 'thoughts' | 'todos' | 'review';
  onUpdateDailyData: (data: DailyData) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  onSectionChange: (section: 'thoughts' | 'todos' | 'review') => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  isTimerActive: (taskId: string) => boolean;
  getElapsedTime: (taskId: string) => number;
}

export function TodayView({
  dailyData,
  tasks,
  projects,
  selectedDate,
  activeSection,
  onUpdateDailyData,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
  onSectionChange,
  onUpdateProject,
  isTimerActive,
  getElapsedTime
}: TodayViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimatedTime: '',
    dueDate: ''
  });

  // Get today's tasks from the global tasks array filtered by selectedDate
  const todayTasks = useMemo(() => {
    return tasks.filter(task =>
      task.dueDate &&
      task.dueDate.getFullYear() === selectedDate.getFullYear() &&
      task.dueDate.getMonth() === selectedDate.getMonth() &&
      task.dueDate.getDate() === selectedDate.getDate()
    );
  }, [tasks, selectedDate]);

  // Get completion stats
  const completionStats = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [todayTasks]);

  // Task management
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    // Fix: Ensure dueDate is set to local midnight of selectedDate
    const dueDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, 0, 0, 0
    );

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newTaskTitle.trim(),
      description: '',
      completed: false,
      priority: 'medium',
      dueDate,
      source: 'manual',
      workSessions: []
    };

    onAddTask(newTask);
    setNewTaskTitle('');
    setShowNewTaskForm(false);
  };

  const handleToggleTask = (task: Task) => {
    if (task.source === 'app-builder' && task.sourceId) {
      // Update project task
      const project = projects.find(p => p.id === task.sourceId);
      if (project) {
        const updatedOneTimeTasks = project.oneTimeTasks.map(t =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        onUpdateProject(project.id, { oneTimeTasks: updatedOneTimeTasks });
      }
    } else {
      // Update global task
      onUpdateTask(task.id, { completed: !task.completed });
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      estimatedTime: task.estimatedTime?.toString() || '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !editForm.title.trim()) return;

    // Fix: Properly set dueDate to local midnight of the selected date
    const dueDate = editForm.dueDate
      ? (() => {
          const [year, month, day] = editForm.dueDate.split('-').map(Number);
          return new Date(year, month - 1, day, 0, 0, 0, 0);
        })()
      : undefined;

    const updates = {
      title: editForm.title.trim(),
      description: editForm.description,
      priority: editForm.priority,
      estimatedTime: editForm.estimatedTime ? parseInt(editForm.estimatedTime) : undefined,
      dueDate
    };

    // Find task in global array
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
      if (task.source === 'app-builder' && task.sourceId) {
        // Update project task
        const project = projects.find(p => p.id === task.sourceId);
        if (project) {
          const updatedOneTimeTasks = project.oneTimeTasks.map(t =>
            t.id === task.id ? { ...t, ...updates } : t
          );
          onUpdateProject(project.id, { oneTimeTasks: updatedOneTimeTasks });
        }
      } else {
        // Update global task
        onUpdateTask(editingTaskId, updates);
      }
    }

    setEditingTaskId(null);
    setEditForm({
      title: '',
      description: '',
      priority: 'medium',
      estimatedTime: '',
      dueDate: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditForm({
      title: '',
      description: '',
      priority: 'medium',
      estimatedTime: '',
      dueDate: ''
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const task = todayTasks.find(t => t.id === taskId);
    if (task) {
      if (task.source === 'app-builder' && task.sourceId) {
        // Delete from project
        const project = projects.find(p => p.id === task.sourceId);
        if (project) {
          const updatedOneTimeTasks = project.oneTimeTasks.filter(t => t.id !== taskId);
          onUpdateProject(project.id, { oneTimeTasks: updatedOneTimeTasks });
        }
      } else {
        // Delete global task
        onDeleteTask(taskId);
      }
    }
  };

  const updateDailyData = (updates: Partial<DailyData>) => {
    const updatedData = { ...dailyData[0], ...updates, updatedAt: new Date() };
    onUpdateDailyData(updatedData);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return <Target className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Coffee className="w-3 h-3" />;
      default: return <Square className="w-3 h-3" />;
    }
  };

  // Navigation tabs
  const tabs = [
    { id: 'thoughts', label: 'Thoughts', icon: Brain },
    { id: 'todos', label: 'Tasks', icon: CheckSquare },
    { id: 'review', label: 'Review', icon: Award }
  ] as const;

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-sm">
      {/* Section Navigation */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex space-x-1 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'thoughts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Daily Thoughts</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
              <MarkdownEditor
                value={dailyData[0].thoughts}
                onChange={(value) => updateDailyData({ thoughts: value })}
                placeholder="What's on your mind today? Share your thoughts, ideas, and reflections..."
              />
            </div>
          </div>
        )}

        {activeSection === 'todos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
              <button
                onClick={() => setShowNewTaskForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Progress Bar */}
            {todayTasks.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{completionStats.completed}/{completionStats.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionStats.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* New Task Form */}
            {showNewTaskForm && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="What needs to be done?"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowNewTaskForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks for today</h3>
                  <p className="text-gray-600">Add a task to get started with your day!</p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 transition-all duration-200 ${
                      task.completed ? 'opacity-75' : ''
                    }`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={2}
                        />
                        <div className="flex items-center space-x-4">
                          <select
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Task['priority'] })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                          <input
                            type="number"
                            value={editForm.estimatedTime}
                            onChange={(e) => setEditForm({ ...editForm, estimatedTime: e.target.value })}
                            placeholder="Est. time (min)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 w-32"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`flex-shrink-0 mt-1 p-1 rounded transition-colors ${
                            task.completed 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className={`text-sm mt-1 ${
                                  task.completed ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {task.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-3">
                              {/* Priority Badge */}
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {getPriorityIcon(task.priority)}
                                <span className="capitalize">{task.priority}</span>
                              </span>
                              
                              {/* Estimated Time */}
                              {task.estimatedTime && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {formatTime(task.estimatedTime)}
                                </span>
                              )}
                              
                              {/* Timer */}
                              {isTimerActive(task.id) ? (
                                <button
                                  onClick={() => onStopTimer(task.id)}
                                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                                >
                                  <Pause className="w-4 h-4" />
                                  <span className="text-xs">{formatTime(getElapsedTime(task.id))}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onStartTimer(task.id)}
                                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(task)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Actual Time Spent */}
                          {task.actualTime && task.actualTime > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Time spent: {formatTime(task.actualTime)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Day Review</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Highlights */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Sun className="w-5 h-5 text-yellow-500 mr-2" />
                  Highlights
                </h3>
                <MarkdownEditor
                  value={dailyData[0].dayReview.highlights}
                  onChange={(value) => updateDailyData({ 
                    dayReview: { ...dailyData[0].dayReview, highlights: value }
                  })}
                  placeholder="What went well today? What are you proud of?"
                />
              </div>

              {/* Challenges */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="w-5 h-5 text-red-500 mr-2" />
                  Challenges
                </h3>
                <MarkdownEditor
                  value={dailyData[0].dayReview.challenges}
                  onChange={(value) => updateDailyData({ 
                    dayReview: { ...dailyData[0].dayReview, challenges: value }
                  })}
                  placeholder="What was difficult? What could be improved?"
                />
              </div>

              {/* Learnings */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 text-blue-500 mr-2" />
                  Learnings
                </h3>
                <MarkdownEditor
                  value={dailyData[0].dayReview.learnings}
                  onChange={(value) => updateDailyData({ 
                    dayReview: { ...dailyData[0].dayReview, learnings: value }
                  })}
                  placeholder="What did you learn today? Any insights?"
                />
              </div>

              {/* Tomorrow */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <ArrowRight className="w-5 h-5 text-green-500 mr-2" />
                  Tomorrow
                </h3>
                <MarkdownEditor
                  value={dailyData[0].dayReview.tomorrow}
                  onChange={(value) => updateDailyData({ 
                    dayReview: { ...dailyData[0].dayReview, tomorrow: value }
                  })}
                  placeholder="What's your plan for tomorrow?"
                />
              </div>
            </div>

            {/* Gratitude */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="w-5 h-5 text-pink-500 mr-2" />
                Gratitude
              </h3>
              <div className="space-y-2">
                {dailyData[0].dayReview.gratitude.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-pink-500">❤</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newGratitude = [...dailyData[0].dayReview.gratitude, ''];
                    updateDailyData({ 
                      dayReview: { ...dailyData[0].dayReview, gratitude: newGratitude }
                    });
                  }}
                  className="text-sm text-pink-600 hover:text-pink-700 transition-colors"
                >
                  + Add gratitude item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 