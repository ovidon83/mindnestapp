import React, { useState } from 'react';
import { CheckSquare, Circle, CheckCircle, Edit2, Trash2, Plus, Search, Calendar, Clock, Flag } from 'lucide-react';
import { useMindnestStore } from '../store';

export const ToDoView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const { 
    thoughts, 
    todos, 
    updateThought, 
    deleteThought, 
    addTodo, 
    updateTodo, 
    deleteTodo, 
    toggleTodo 
  } = useMindnestStore();

  // Get AI-tagged tasks from thoughts
  const aiTaggedTasks = thoughts.filter(thought => 
    thought.type === 'todo'
  );

  // Get regular todos
  const regularTodos = showCompleted ? todos : todos.filter(todo => !todo.completed);

  // Combine and filter all tasks
  const allTasks = [
    ...aiTaggedTasks.map(thought => ({
      ...thought,
      source: 'thought' as const,
      priority: thought.priority || 'medium',
      completed: thought.metadata?.completed || false,
      dueDate: thought.dueDate
    })),
    ...regularTodos.map(todo => ({
      ...todo,
      source: 'todo' as const,
      content: todo.content,
      timestamp: todo.createdAt,
      tags: todo.tags || []
    }))
  ];

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'created':
        const aDate = a.source === 'thought' ? a.timestamp : (a as any).createdAt;
        const bDate = b.source === 'thought' ? b.timestamp : (b as any).createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      default:
        return 0;
    }
  });

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditContent(task.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    
    const task = allTasks.find(t => t.id === editingId);
    if (!task) return;

    if (task.source === 'thought') {
      updateThought(editingId, { content: editContent.trim() });
    } else {
      updateTodo(editingId, { content: editContent.trim() });
    }
    
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (task: any) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    if (task.source === 'thought') {
      deleteThought(task.id);
    } else {
      deleteTodo(task.id);
    }
  };

  const handleToggleComplete = (task: any) => {
    if (task.source === 'thought') {
      updateThought(task.id, { 
        metadata: { 
          ...task.metadata, 
          completed: !task.completed 
        }
      });
    } else {
      toggleTodo(task.id);
    }
  };

  const handleAddNewTask = () => {
    if (!newTaskContent.trim()) return;
    
    addTodo({
      content: newTaskContent.trim(),
      completed: false,
      priority: 'medium',
      tags: []
    });
    
    setNewTaskContent('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flag className="text-red-500" size={14} />;
      case 'medium': return <Flag className="text-yellow-500" size={14} />;
      case 'low': return <Flag className="text-green-500" size={14} />;
      default: return <Flag className="text-gray-400" size={14} />;
    }
  };

  const TaskCard: React.FC<{ task: any; index: number }> = ({ task, index }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group ${
      task.completed ? 'opacity-60' : ''
    }`}>
      {editingId === task.id ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Drag handle */}
            <div className="flex items-center">
              <span className="text-gray-400 text-sm font-mono">{index + 1}</span>
            </div>
            
            <button
              onClick={() => handleToggleComplete(task)}
              className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {task.completed ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <Circle size={20} className="text-gray-400 hover:text-green-500" />
              )}
            </button>
            
            <div className="flex-1">
              <p className={`text-gray-800 font-medium leading-relaxed ${
                task.completed ? 'line-through opacity-60' : ''
              }`}>
                {task.content}
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                {/* Priority */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  <span className="capitalize">{task.priority}</span>
                </div>
                
                {/* Source */}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.source === 'thought' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {task.source === 'thought' ? 'AI Tagged' : 'Manual'}
                </span>
                
                {/* Due date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1">
                    {task.tags.slice(0, 2).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                <Clock size={12} className="inline mr-1" />
                {new Date(task.source === 'thought' ? task.timestamp : (task as any).createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(task)}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(task)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <CheckSquare className="text-blue-600" size={36} />
            To-Do Manager
          </h1>
          <p className="text-gray-600 font-medium">
            Manage all your tasks in one place - AI-tagged and manual todos
          </p>
        </div>

        {/* Quick Add */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewTask();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddNewTask}
              disabled={!newTaskContent.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>

        {/* Stats & Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div>
              <div className="text-2xl font-bold text-blue-600">{allTasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {allTasks.filter(t => t.completed).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {aiTaggedTasks.length}
              </div>
              <div className="text-sm text-gray-600">AI Tagged</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {allTasks.filter(t => t.priority === 'high' && !t.completed).length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="created">Sort by Created</option>
            </select>

            {/* Show Completed Toggle */}
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showCompleted 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {sortedTasks.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {allTasks.length === 0 ? "No tasks yet!" : "No matching tasks"}
            </h2>
            <p className="text-gray-600 mb-6">
              {allTasks.length === 0 
                ? "Add your first task above or use the Unpack view to brain dump and let AI categorize your thoughts."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            
            {allTasks.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  💡 Pro tip: Tasks created from thoughts in the Unpack view will automatically appear here with the "AI Tagged" label.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        )}

        {/* Task Management Tips */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            📋 Task Management Tips
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-gray-900">AI Tagged Tasks:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Created automatically from brain dumps</li>
                <li>• Enhanced with AI-suggested priorities</li>
                <li>• Can be edited and managed like any task</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">Task Management:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Click to mark complete/incomplete</li>
                <li>• Edit in-place with double-click</li>
                <li>• Sort and filter to find what you need</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};