import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Calendar,
  Target,
  CheckCircle,
  Circle,
  Trash2,
  Briefcase,
  ChevronRight,
  X,
  Loader2,
  Edit3,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useMindnestStore } from '../store';

const isToday = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toDateString() === new Date().toDateString();
};

const isOverdue = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d < today && d.toDateString() !== today.toDateString();
};

const statusColors = {
  idea: 'bg-blue-100 text-blue-700',
  planning: 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  paused: 'bg-gray-100 text-gray-700',
};

const statusIcons = {
  idea: Target,
  planning: Clock,
  'in-progress': TrendingUp,
  completed: CheckCircle,
  paused: X,
};

export const ProjectSpace: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  
  const { projects, addProject, updateProject, deleteProject, addTodo, todos, updateTodo, deleteTodo } = useMindnestStore();

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      addProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        status: 'idea',
        deadline: newProjectDeadline ? new Date(newProjectDeadline) : undefined,
      });

      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectDeadline('');
      setShowNewProjectForm(false);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskContent.trim() || isAddingTask) return;

    setIsAddingTask(true);
    try {
      addTodo({
        content: newTaskContent.trim(),
        completed: false,
        priority: 'medium',
        projectId,
      });

      setNewTaskContent('');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleStartEdit = (project: any) => {
    setEditingProject(project.id);
    setEditingName(project.name);
    setEditingDescription(project.description || '');
  };

  const handleSaveEdit = async (projectId: string) => {
    if (!editingName.trim()) return;
    
    updateProject(projectId, {
      name: editingName.trim(),
      description: editingDescription.trim(),
    });
    setEditingProject(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  const getProjectProgress = (project: any) => {
    const projectTodos = todos.filter((todo: any) => todo.projectId === project.id);
    const totalTasks = projectTodos.length;
    const completedTasks = projectTodos.filter((todo: any) => todo.completed).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getProjectStatus = (project: any) => {
    if (!project.deadline) return project.status;
    if (isOverdue(project.deadline)) return 'overdue';
    if (isToday(project.deadline)) return 'due-today';
    return project.status;
  };

  const handleToggleTask = (taskId: string) => {
    const task = todos.find(t => t.id === taskId);
    if (task) {
      updateTodo(taskId, { completed: !task.completed });
    }
  };

  // Group projects by status
  const groupedProjects = projects.reduce((acc, project) => {
    const status = getProjectStatus(project);
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<string, any[]>);

  const statusOrder = ['in-progress', 'planning', 'idea', 'completed', 'paused', 'overdue', 'due-today'];

  if (selectedProject && selectedProjectData) {
    const projectTodos = todos.filter((todo: any) => todo.projectId === selectedProjectData.id);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedProject(null)}
              onKeyPress={(e) => handleKeyPress(e, () => setSelectedProject(null))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
              aria-label="Back to projects"
            >
              <X size={20} />
              <span>Back to Projects</span>
            </button>
            <button
              onClick={() => deleteProject(selectedProjectData.id)}
              onKeyPress={(e) => handleKeyPress(e, () => deleteProject(selectedProjectData.id))}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
              aria-label="Delete project"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div>
              {editingProject === selectedProjectData.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full text-3xl font-light text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 mb-4"
                    placeholder="Project name..."
                    aria-label="Project name"
                  />
                  
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="Project description..."
                    className="w-full p-4 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                    rows={3}
                    aria-label="Project description"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(selectedProjectData.id)}
                      onKeyPress={(e) => handleKeyPress(e, () => handleSaveEdit(selectedProjectData.id))}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                      aria-label="Save changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      onKeyPress={(e) => handleKeyPress(e, handleCancelEdit)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-3xl font-light text-gray-900">{selectedProjectData.name}</h1>
                    <button
                      onClick={() => handleStartEdit(selectedProjectData)}
                      onKeyPress={(e) => handleKeyPress(e, () => handleStartEdit(selectedProjectData))}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                      aria-label="Edit project"
                    >
                      <Edit3 size={20} />
                    </button>
                  </div>
                  
                  {selectedProjectData.description && (
                    <div className="text-gray-600 text-lg leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: selectedProjectData.description }} />
                  )}
                  
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedProjectData.status}
                      onChange={(e) => updateProject(selectedProjectData.id, { status: e.target.value as any })}
                      className="px-3 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                      aria-label="Project status"
                    >
                      <option value="idea">Idea</option>
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                    
                    {selectedProjectData.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>Due {format(selectedProjectData.deadline, 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 mb-6">Tasks</h3>
            
            {/* Add New Task */}
            <div className="flex gap-3 mb-6">
              <input
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask(selectedProjectData.id)}
                placeholder="Add a new task..."
                className="flex-1 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500"
                aria-label="New task content"
                disabled={isAddingTask}
              />
              <button
                onClick={() => handleAddTask(selectedProjectData.id)}
                onKeyPress={(e) => handleKeyPress(e, () => handleAddTask(selectedProjectData.id))}
                disabled={!newTaskContent.trim() || isAddingTask}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center gap-2"
                aria-label="Add task to project"
              >
                {isAddingTask ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add
                  </>
                )}
              </button>
            </div>
            
            {/* Tasks List */}
            <div className="space-y-3" role="list" aria-label="Project tasks">
              {projectTodos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No tasks yet. Add your first task above!</p>
                </div>
              ) : (
                projectTodos.map((todo: any) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    role="listitem"
                    aria-label={`Task: ${todo.content}`}
                  >
                    <button 
                      onClick={() => handleToggleTask(todo.id)}
                      onKeyPress={(e) => handleKeyPress(e, () => handleToggleTask(todo.id))}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                      aria-label={todo.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                      aria-pressed={todo.completed}
                    >
                      {todo.completed ? <CheckCircle size={20} className="text-green-600" /> : <Circle size={20} />}
                    </button>
                    
                    <span className={`flex-1 ${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}>
                      {todo.content}
                    </span>
                    
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      onKeyPress={(e) => handleKeyPress(e, () => deleteTodo(todo.id))}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <Briefcase size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">Projects</h1>
              <p className="text-sm text-gray-600 mt-1">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewProjectForm(true)}
            onKeyPress={(e) => handleKeyPress(e, () => setShowNewProjectForm(true))}
            className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium min-h-[48px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
            aria-label="Create new project"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Projects by Status */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase size={24} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Create your first project to organize your tasks and goals.
            </p>
            <button
              onClick={() => setShowNewProjectForm(true)}
              onKeyPress={(e) => handleKeyPress(e, () => setShowNewProjectForm(true))}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Create your first project"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {statusOrder.map(status => {
              const statusProjects = groupedProjects[status];
              if (!statusProjects || statusProjects.length === 0) return null;
              
              const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Target;
              
              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon size={20} className="text-gray-600" />
                    <h2 className="text-lg font-medium text-gray-900 capitalize">
                      {status.replace('-', ' ')} ({statusProjects.length})
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusProjects.map((project) => {
                      const progress = getProjectProgress(project);
                      
                      return (
                        <div
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          onKeyPress={(e) => handleKeyPress(e, () => setSelectedProject(project.id))}
                          className="bg-white rounded-xl p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
                          role="button"
                          tabIndex={0}
                          aria-label={`Project: ${project.name}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-medium text-gray-900 text-lg leading-tight flex-1 pr-2">
                              {project.name}
                            </h3>
                            <ChevronRight size={20} className="text-gray-400" />
                          </div>
                          
                          {project.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: project.description }} />
                          )}
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.idea}`}>
                                {status.replace('-', ' ')}
                              </span>
                              <span className="text-sm text-gray-600">{progress}%</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gray-900 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Project progress: ${progress}%`}
                              />
                            </div>
                            
                            {project.deadline && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>
                                  {isToday(project.deadline) ? 'Due today' : 
                                   isOverdue(project.deadline) ? 'Overdue' :
                                   `Due ${format(project.deadline, 'MMM d')}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
          >
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 id="new-project-title" className="text-lg font-medium text-gray-900">Create New Project</h3>
                  <button
                    onClick={() => setShowNewProjectForm(false)}
                    onKeyPress={(e) => handleKeyPress(e, () => setShowNewProjectForm(false))}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 text-lg"
                  aria-label="Project name"
                  disabled={isCreatingProject}
                />
                
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Project description..."
                  className="w-full h-32 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                  aria-label="Project description"
                  disabled={isCreatingProject}
                />
                
                <input
                  type="date"
                  value={newProjectDeadline}
                  onChange={(e) => setNewProjectDeadline(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white text-gray-700"
                  aria-label="Project deadline"
                  disabled={isCreatingProject}
                />
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewProjectForm(false)}
                  onKeyPress={(e) => handleKeyPress(e, () => setShowNewProjectForm(false))}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                  aria-label="Cancel creating project"
                  disabled={isCreatingProject}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  onKeyPress={(e) => handleKeyPress(e, handleCreateProject)}
                  disabled={!newProjectName.trim() || isCreatingProject}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center gap-2"
                  aria-label="Create project"
                >
                  {isCreatingProject ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 