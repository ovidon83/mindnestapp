import { useState, useMemo } from 'react';
import { 
  Plus, 
  Rocket, 
  Calendar,
  Clock,
  Target,
  CheckSquare,
  Zap,
  Star,
  TrendingUp,
  Edit3,
  Trash2,
  Save,
  X,
  FolderOpen,
  FileText
} from 'lucide-react';
import { Project, ProjectTask, RecurringTask, DayOfWeek } from '../types';
import MarkdownEditor from './MarkdownEditor';
import { generateId } from '../utils/helpers';

interface AppBuilderProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AppBuilder({
  projects,
  onUpdateProject,
  onCreateProject
}: AppBuilderProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewRecurringForm, setShowNewRecurringForm] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'tasks' | 'recurring' | 'notes'>('overview');
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    category: 'web' as Project['category'],
    priority: 'medium' as Project['priority'],
    targetLaunch: ''
  });

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as ProjectTask['priority'],
    estimatedTime: '',
    dueDate: ''
  });

  const [newRecurringForm, setNewRecurringForm] = useState({
    title: '',
    description: '',
    estimatedTime: '',
    daysOfWeek: [] as DayOfWeek[]
  });

  const [editRecurringForm, setEditRecurringForm] = useState({
    title: '',
    description: '',
    estimatedTime: '',
    daysOfWeek: [] as DayOfWeek[]
  });

  // Get current project
  const currentProject = projects.find(p => p.id === selectedProject);

  // Project statistics
  const projectStats = useMemo(() => {
    if (!currentProject) return null;

    const totalTasks = currentProject.oneTimeTasks.length;
    const completedTasks = currentProject.oneTimeTasks.filter(t => t.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const overdueTasks = currentProject.oneTimeTasks.filter(t => 
      !t.completed && t.dueDate && t.dueDate < new Date()
    ).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalEstimated = currentProject.oneTimeTasks.reduce((acc, task) => 
      acc + (task.estimatedTime || 0), 0
    );
    
    const totalActual = currentProject.oneTimeTasks.reduce((acc, task) => 
      acc + (task.actualTime || 0), 0
    );

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      overdueTasks,
      completionRate,
      totalEstimated,
      totalActual
    };
  }, [currentProject]);

  // Handle creating new project
  const handleCreateProject = () => {
    if (!newProjectForm.name.trim()) return;

    onCreateProject({
      name: newProjectForm.name.trim(),
      description: newProjectForm.description.trim(),
      category: newProjectForm.category,
      status: 'planning',
      priority: newProjectForm.priority,
      targetLaunch: newProjectForm.targetLaunch ? new Date(newProjectForm.targetLaunch) : undefined,
      recurringTasks: [],
      oneTimeTasks: [],
      links: [],
      notes: '',
      totalTimeSpent: 0
    });

    setNewProjectForm({
      name: '',
      description: '',
      category: 'web',
      priority: 'medium',
      targetLaunch: ''
    });
    setShowNewProjectForm(false);
  };

  // Handle creating new task
  const handleCreateTask = () => {
    if (!currentProject || !newTaskForm.title.trim()) return;

    const newTask: ProjectTask = {
      id: generateId(),
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || undefined,
      completed: false,
      priority: newTaskForm.priority,
      estimatedTime: newTaskForm.estimatedTime ? parseInt(newTaskForm.estimatedTime) : undefined,
      dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
      workSessions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onUpdateProject(currentProject.id, {
      oneTimeTasks: [...currentProject.oneTimeTasks, newTask]
    });

    setNewTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      estimatedTime: '',
      dueDate: ''
    });
    setShowNewTaskForm(false);
  };

  // Handle creating recurring task
  const handleCreateRecurringTask = () => {
    if (!currentProject || !newRecurringForm.title.trim()) return;
    
    if (newRecurringForm.daysOfWeek.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    const newRecurringTask: RecurringTask = {
      id: generateId(),
      title: newRecurringForm.title.trim(),
      description: newRecurringForm.description.trim() || undefined,
      estimatedTime: newRecurringForm.estimatedTime ? parseInt(newRecurringForm.estimatedTime) : 30,
      daysOfWeek: newRecurringForm.daysOfWeek,
      isActive: true,
      createdAt: new Date()
    };

    onUpdateProject(currentProject.id, {
      recurringTasks: [...currentProject.recurringTasks, newRecurringTask]
    });

    setNewRecurringForm({
      title: '',
      description: '',
      estimatedTime: '',
      daysOfWeek: []
    });
    setShowNewRecurringForm(false);
  };

  // Handle editing recurring task
  const handleStartEditRecurring = (task: RecurringTask) => {
    setEditingRecurringId(task.id);
    setEditRecurringForm({
      title: task.title,
      description: task.description || '',
      estimatedTime: task.estimatedTime.toString(),
      daysOfWeek: task.daysOfWeek
    });
  };

  const handleSaveEditRecurring = () => {
    if (!currentProject || !editingRecurringId || !editRecurringForm.title.trim()) return;

    const updatedRecurringTasks = currentProject.recurringTasks.map(task =>
      task.id === editingRecurringId ? {
        ...task,
        title: editRecurringForm.title.trim(),
        description: editRecurringForm.description.trim() || undefined,
        estimatedTime: editRecurringForm.estimatedTime ? parseInt(editRecurringForm.estimatedTime) : 30,
        daysOfWeek: editRecurringForm.daysOfWeek
      } : task
    );

    onUpdateProject(currentProject.id, { recurringTasks: updatedRecurringTasks });
    setEditingRecurringId(null);
  };

  const handleCancelEditRecurring = () => {
    setEditingRecurringId(null);
    setEditRecurringForm({
      title: '',
      description: '',
      estimatedTime: '',
      daysOfWeek: []
    });
  };

  const handleToggleRecurringActive = (taskId: string) => {
    if (!currentProject) return;

    const updatedRecurringTasks = currentProject.recurringTasks.map(task =>
      task.id === taskId ? { ...task, isActive: !task.isActive } : task
    );

    onUpdateProject(currentProject.id, { recurringTasks: updatedRecurringTasks });
  };

  const handleDeleteRecurringTask = (taskId: string) => {
    if (!currentProject) return;

    const updatedRecurringTasks = currentProject.recurringTasks.filter(task => task.id !== taskId);
    onUpdateProject(currentProject.id, { recurringTasks: updatedRecurringTasks });
  };

  const handleToggleTask = (taskId: string) => {
    if (!currentProject) return;

    const updatedOneTimeTasks = currentProject.oneTimeTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    onUpdateProject(currentProject.id, { oneTimeTasks: updatedOneTimeTasks });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-blue-600 bg-blue-50';
      case 'building': return 'text-yellow-600 bg-yellow-50';
      case 'testing': return 'text-purple-600 bg-purple-50';
      case 'launched': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web': return <FileText className="w-4 h-4" />;
      case 'mobile': return <Zap className="w-4 h-4" />;
      case 'saas': return <Rocket className="w-4 h-4" />;
      case 'design': return <Star className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
    }
  };

  const daysOfWeek = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ] as const;

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'recurring', label: 'Recurring', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: FileText }
  ] as const;

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-sm">
      {/* Project Selection Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">App Builder</h1>
            {currentProject && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{currentProject.name}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="mt-4 flex space-x-2 overflow-x-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedProject === project.id
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 p-4">
          <div className="space-y-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentProject ? (
            <div className="text-center py-12">
              <Rocket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Selected</h2>
              <p className="text-gray-600 mb-6">Create your first project to get started!</p>
              <button
                onClick={() => setShowNewProjectForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
              >
                Create Project
              </button>
            </div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>
                  </div>

                  {/* Project Stats */}
                  {projectStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Tasks</p>
                            <p className="text-2xl font-bold text-gray-900">{projectStats.totalTasks}</p>
                          </div>
                          <CheckSquare className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{projectStats.completedTasks}</p>
                          </div>
                          <Target className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-600">{projectStats.completionRate}%</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Time Spent</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {formatTime(projectStats.totalActual)}
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Details */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{currentProject.name}</h3>
                        <p className="text-gray-600 mt-1">{currentProject.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProject.status)}`}>
                          {currentProject.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentProject.priority)}`}>
                          {currentProject.priority}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getCategoryIcon(currentProject.category)}
                          <span className="font-medium capitalize">{currentProject.category}</span>
                        </div>
                      </div>
                      
                      {currentProject.targetLaunch && (
                        <div>
                          <p className="text-sm text-gray-600">Target Launch</p>
                          <p className="font-medium mt-1">
                            {currentProject.targetLaunch.toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {currentProject.oneTimeTasks.slice(-3).reverse().map((task) => (
                        <div key={task.id} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.completed ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <span className={`text-sm ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}>
                            {task.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.updatedAt.toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'tasks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Project Tasks</h2>
                    <button
                      onClick={() => setShowNewTaskForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  {/* New Task Form */}
                  {showNewTaskForm && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={newTaskForm.title}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                          placeholder="Task title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <textarea
                          value={newTaskForm.description}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                          placeholder="Task description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={3}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <select
                            value={newTaskForm.priority}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                          <input
                            type="number"
                            value={newTaskForm.estimatedTime}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, estimatedTime: e.target.value })}
                            placeholder="Est. time (min)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <input
                            type="date"
                            value={newTaskForm.dueDate}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleCreateTask}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Create Task
                          </button>
                          <button
                            onClick={() => setShowNewTaskForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {currentProject.oneTimeTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                        <p className="text-gray-600">Add your first task to get started!</p>
                      </div>
                    ) : (
                      currentProject.oneTimeTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 transition-all duration-200 ${
                            task.completed ? 'opacity-75' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className={`flex-shrink-0 mt-1 p-1 rounded transition-colors ${
                                task.completed 
                                  ? 'text-green-600 hover:text-green-700' 
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {task.completed ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded" />
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
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  
                                  {task.estimatedTime && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {formatTime(task.estimatedTime)}
                                    </span>
                                  )}
                                  
                                  {task.dueDate && (
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      task.dueDate < new Date() && !task.completed
                                        ? 'text-red-600 bg-red-50'
                                        : 'text-gray-500 bg-gray-100'
                                    }`}>
                                      {task.dueDate.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {task.actualTime && task.actualTime > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Time spent: {formatTime(task.actualTime)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'recurring' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Recurring Tasks</h2>
                    <button
                      onClick={() => setShowNewRecurringForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Recurring</span>
                    </button>
                  </div>

                  {/* New Recurring Task Form */}
                  {showNewRecurringForm && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Recurring Task</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={newRecurringForm.title}
                          onChange={(e) => setNewRecurringForm({ ...newRecurringForm, title: e.target.value })}
                          placeholder="Task title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <textarea
                          value={newRecurringForm.description}
                          onChange={(e) => setNewRecurringForm({ ...newRecurringForm, description: e.target.value })}
                          placeholder="Task description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={3}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="number"
                            value={newRecurringForm.estimatedTime}
                            onChange={(e) => setNewRecurringForm({ ...newRecurringForm, estimatedTime: e.target.value })}
                            placeholder="Est. time (min)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Days of the week</p>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <button
                                key={day.value}
                                onClick={() => {
                                  const isSelected = newRecurringForm.daysOfWeek.includes(day.value);
                                  setNewRecurringForm({
                                    ...newRecurringForm,
                                    daysOfWeek: isSelected
                                      ? newRecurringForm.daysOfWeek.filter(d => d !== day.value)
                                      : [...newRecurringForm.daysOfWeek, day.value]
                                  });
                                }}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  newRecurringForm.daysOfWeek.includes(day.value)
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleCreateRecurringTask}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Create Recurring Task
                          </button>
                          <button
                            onClick={() => setShowNewRecurringForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recurring Tasks List */}
                  <div className="space-y-3">
                    {currentProject.recurringTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring tasks</h3>
                        <p className="text-gray-600">Add recurring tasks to automate your workflow!</p>
                      </div>
                    ) : (
                      currentProject.recurringTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50"
                        >
                          {editingRecurringId === task.id ? (
                            <div className="space-y-4">
                              <input
                                type="text"
                                value={editRecurringForm.title}
                                onChange={(e) => setEditRecurringForm({ ...editRecurringForm, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                              />
                              <textarea
                                value={editRecurringForm.description}
                                onChange={(e) => setEditRecurringForm({ ...editRecurringForm, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                rows={2}
                              />
                              <div className="flex items-center space-x-4">
                                <input
                                  type="number"
                                  value={editRecurringForm.estimatedTime}
                                  onChange={(e) => setEditRecurringForm({ ...editRecurringForm, estimatedTime: e.target.value })}
                                  placeholder="Est. time (min)"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 w-32"
                                />
                                <div className="flex flex-wrap gap-2">
                                  {daysOfWeek.map((day) => (
                                    <button
                                      key={day.value}
                                      onClick={() => {
                                        const isSelected = editRecurringForm.daysOfWeek.includes(day.value);
                                        setEditRecurringForm({
                                          ...editRecurringForm,
                                          daysOfWeek: isSelected
                                            ? editRecurringForm.daysOfWeek.filter(d => d !== day.value)
                                            : [...editRecurringForm.daysOfWeek, day.value]
                                        });
                                      }}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        editRecurringForm.daysOfWeek.includes(day.value)
                                          ? 'bg-violet-500 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveEditRecurring}
                                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleCancelEditRecurring}
                                  className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                                  <button
                                    onClick={() => handleToggleRecurringActive(task.id)}
                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                      task.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {task.isActive ? 'Active' : 'Inactive'}
                                  </button>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2">
                                  {task.estimatedTime && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {formatTime(task.estimatedTime)}
                                    </span>
                                  )}
                                  <div className="flex flex-wrap gap-1">
                                    {task.daysOfWeek.map((day) => (
                                      <span
                                        key={day}
                                        className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded"
                                      >
                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleStartEditRecurring(task)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecurringTask(task.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'notes' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Project Notes</h2>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
                    <MarkdownEditor
                      value={currentProject.notes}
                      onChange={(value) => onUpdateProject(currentProject.id, { notes: value })}
                      placeholder="Add your project notes, ideas, and documentation here..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newProjectForm.name}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                placeholder="Project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <textarea
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                placeholder="Project description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newProjectForm.category}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, category: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                  <option value="saas">SaaS</option>
                  <option value="design">Design</option>
                </select>
                <select
                  value={newProjectForm.priority}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, priority: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <input
                type="date"
                value={newProjectForm.targetLaunch}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, targetLaunch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowNewProjectForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
