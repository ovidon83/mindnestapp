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
} from 'lucide-react';
import { useMindnestStore } from '../store';

// Helper function to format dates (unused but kept for future use)
// const formatDate = (date: Date) => {
//   return date.toLocaleDateString('en-US', { 
//     weekday: 'short', 
//     month: 'short', 
//     day: 'numeric' 
//   });
// };

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

export const ProjectSpace: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newTaskContent, setNewTaskContent] = useState('');
  
  const { projects, addProject, updateProject, deleteProject, addTodo, todos, updateTodo, deleteTodo } = useMindnestStore();

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

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
  };

  const handleAddTask = (projectId: string) => {
    if (!newTaskContent.trim()) return;

    addTodo({
      content: newTaskContent.trim(),
      completed: false,
      priority: 'medium',
      projectId,
    });

    setNewTaskContent('');
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

  if (selectedProject && selectedProjectData) {
    const projectTodos = todos.filter((todo: any) => todo.projectId === selectedProjectData.id);
    
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
              <span>Back to Projects</span>
            </button>
            <button
              onClick={() => deleteProject(selectedProjectData.id)}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Project Details */}
          <div className="space-y-8">
            <div>
              <input
                type="text"
                value={selectedProjectData.name}
                onChange={(e) => updateProject(selectedProjectData.id, { name: e.target.value })}
                className="w-full text-3xl font-light text-gray-900 bg-transparent border-0 focus:outline-none placeholder-gray-400 mb-4"
                placeholder="Project name..."
              />
              
              <textarea
                value={selectedProjectData.description}
                onChange={(e) => updateProject(selectedProjectData.id, { description: e.target.value })}
                className="w-full p-4 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                placeholder="Project description..."
                rows={3}
              />
              
              <div className="flex items-center gap-4 mt-4">
                <select
                  value={selectedProjectData.status}
                  onChange={(e) => updateProject(selectedProjectData.id, { status: e.target.value as any })}
                  className="px-3 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
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

            {/* Tasks Section */}
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Tasks</h3>
              
              {/* Add New Task */}
              <div className="flex gap-3 mb-6">
                <input
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask(selectedProjectData.id)}
                  placeholder="Add a new task..."
                  className="flex-1 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500"
                />
                <button
                  onClick={() => handleAddTask(selectedProjectData.id)}
                  disabled={!newTaskContent.trim()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              
              {/* Tasks List */}
              <div className="space-y-3">
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
                    >
                      <button 
                        onClick={() => handleToggleTask(todo.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
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
            className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium min-h-[48px] touch-manipulation"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
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
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = getProjectProgress(project);
              const status = getProjectStatus(project);
              
              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-900 text-lg leading-tight flex-1 pr-2">
                      {project.name}
                    </h3>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {project.description}
                    </p>
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
        )}

        {/* New Project Modal */}
        {showNewProjectForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
                  <button
                    onClick={() => setShowNewProjectForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                />
                
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Project description..."
                  className="w-full h-32 p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 resize-none"
                />
                
                <input
                  type="date"
                  value={newProjectDeadline}
                  onChange={(e) => setNewProjectDeadline(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white text-gray-700"
                />
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewProjectForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 