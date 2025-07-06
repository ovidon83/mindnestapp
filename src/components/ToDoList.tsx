import React, { useState } from 'react';
import type { TodoItem } from '../types';
import { 
  CheckSquare, Plus, Trash2, CheckCircle2, Circle, Calendar, 
  ChevronRight, ChevronDown, FileText, Edit3, Save, X 
} from 'lucide-react';
import { useMindnestStore } from '../store';

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

const isToday = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(Date.parse(date)) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

const isOverdue = (date: Date | string | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(Date.parse(date)) : date;
  const today = new Date();
  return d < today && !isToday(d);
};

const priorityColors = {
  low: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-700',
};

// Helper: extract tags from #hashtags in a string
function extractTags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

// Helper: remove #tags from text
function removeTagsFromText(text: string): string {
  return text.replace(/#(\w+)/g, '').replace(/\s+/g, ' ').trim();
}

// Tag color generator
const tagColors = [
  'bg-gray-100 text-gray-700',
  'bg-blue-50 text-blue-700',
  'bg-green-50 text-green-700',
  'bg-purple-50 text-purple-700',
  'bg-orange-50 text-orange-700',
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash += tag.charCodeAt(i);
  return tagColors[hash % tagColors.length];
}

export const ToDoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');
  const [view, setView] = useState<'all' | 'today'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [newSubTasks, setNewSubTasks] = useState<Record<string, string>>({});
  
  const { todos, addTodo, addSubTodo, toggleTodo, deleteTodo, updateTodo } = useMindnestStore();

  // Collect all unique tags
  const allTags = Array.from(new Set(todos.flatMap(t => t.tags || [])));

  // Filter todos based on view and tag
  const filteredTodos = todos.filter(todo => {
    if (view === 'today' && !isToday(todo.dueDate)) return false;
    if (filterTag !== 'all' && !(todo.tags || []).includes(filterTag)) return false;
    return true;
  });

  // Group todos
  const incompleteTodos = filteredTodos.filter(todo => !todo.completed);
  const completedTodos = filteredTodos.filter(todo => todo.completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const tagsFromTitle = extractTags(newTodo);
    const tags = Array.from(new Set(tagsFromTitle));
    
    addTodo({
      content: removeTagsFromText(newTodo),
      completed: false,
      priority: 'medium',
      tags,
      dueDate: view === 'today' ? new Date() : undefined,
    });
    
    setNewTodo('');
  };

  const getTaskStatusColor = (todo: TodoItem) => {
    if (todo.completed) return 'text-gray-500';
    if (isOverdue(todo.dueDate)) return 'text-red-600';
    if (isToday(todo.dueDate)) return 'text-blue-600';
    return 'text-gray-800';
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleEditNotes = (taskId: string, currentNotes: string = '') => {
    setEditingNotes(taskId);
    setNoteText(currentNotes);
  };

  const handleSaveNotes = (taskId: string) => {
    updateTodo(taskId, { notes: noteText });
    setEditingNotes(null);
    setNoteText('');
  };

  const handleAddSubTask = (parentId: string) => {
    const content = newSubTasks[parentId]?.trim();
    if (!content) return;
    
    const tagsFromTitle = extractTags(content);
    const tags = Array.from(new Set(tagsFromTitle));
    
    addSubTodo(parentId, {
      content: removeTagsFromText(content),
      completed: false,
      priority: 'medium',
      tags,
    });
    
    setNewSubTasks(prev => ({ ...prev, [parentId]: '' }));
  };

  const TaskItem = ({ todo, isSubTask = false }: { todo: TodoItem; isSubTask?: boolean }) => {
    const isExpanded = expandedTasks.has(todo.id);
    const hasSubTasks = todo.children && todo.children.length > 0;
    const hasNotes = todo.notes && todo.notes.trim().length > 0;
    const canExpand = hasSubTasks || hasNotes || !isSubTask;

    return (
      <div className={`${isSubTask ? 'ml-8' : ''}`}>
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
          <button
            onClick={() => toggleTodo(todo.id)}
            className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {todo.completed ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <Circle size={20} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                {canExpand && (
                  <button
                    onClick={() => toggleTaskExpansion(todo.id)}
                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                )}
                
                <p className={`${
                  todo.completed ? 'line-through text-gray-500' : getTaskStatusColor(todo)
                } leading-relaxed flex-1`}>
                  {todo.content}
                </p>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isSubTask && (
                  <button
                    onClick={() => handleEditNotes(todo.id, todo.notes)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit notes"
                  >
                    <FileText size={16} />
                  </button>
                )}
                
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {(todo.tags && todo.tags.length > 0) || todo.dueDate ? (
              <div className="flex items-center gap-2 mt-2">
                {todo.tags && todo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {todo.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-xs ${getTagColor(tag)}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {todo.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>{formatDate(todo.dueDate)}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 ml-8 space-y-3">
            {/* Notes Section */}
            {editingNotes === todo.id ? (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Notes</span>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes for this task..."
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setEditingNotes(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveNotes(todo.id)}
                    className="px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : hasNotes ? (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Notes</span>
                  </div>
                  <button
                    onClick={() => handleEditNotes(todo.id, todo.notes)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {todo.notes}
                </p>
              </div>
            ) : null}

            {/* Sub-tasks Section */}
            {!isSubTask && (
              <div className="space-y-2">
                {hasSubTasks && (
                  <div className="space-y-2">
                    {todo.children.map((subTask) => (
                      <TaskItem key={subTask.id} todo={subTask} isSubTask={true} />
                    ))}
                  </div>
                )}
                
                {/* Add Sub-task */}
                <div className="flex gap-2">
                  <input
                    value={newSubTasks[todo.id] || ''}
                    onChange={(e) => setNewSubTasks(prev => ({ ...prev, [todo.id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubTask(todo.id)}
                    placeholder="Add sub-task..."
                    className="flex-1 p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  />
                  <button
                    onClick={() => handleAddSubTask(todo.id)}
                    disabled={!newSubTasks[todo.id]?.trim()}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <CheckSquare size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">Tasks</h1>
              <p className="text-sm text-gray-600 mt-1">
                {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setView('today')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Today
              </button>
            </div>
            
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-3 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Add New Task */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task... (use #tags for organization)"
              className="flex-1 p-3 sm:p-4 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white placeholder-gray-500 text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={!newTodo.trim()}
              className="w-full sm:w-auto px-6 py-3 sm:py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium min-h-[48px] touch-manipulation"
            >
              <Plus size={16} />
              Add Task
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="space-y-8">
          {/* Incomplete Tasks */}
          {incompleteTodos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {view === 'today' ? 'Today Tasks' : 'Active Tasks'}
                <span className="ml-2 text-sm text-gray-500">({incompleteTodos.length})</span>
              </h3>
              <div className="space-y-3">
                {incompleteTodos.map((todo) => (
                  <TaskItem key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTodos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Completed
                <span className="ml-2 text-sm text-gray-500">({completedTodos.length})</span>
              </h3>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <TaskItem key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTodos.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckSquare size={24} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {view === 'today' ? 'No tasks for today' : 'No tasks yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {view === 'today' 
                  ? 'Add some tasks to get started with your day.'
                  : 'Create your first task to get organized.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 