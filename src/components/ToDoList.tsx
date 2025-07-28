import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Calendar,
  Target,
  Search,
  Edit3,
  FileText,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Save,
  X,
  FolderOpen,
  BarChart3,
  Zap,
  Hash,
  Filter,
  Star,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  ListTodo,
  CheckCircle,
  Circle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Helper function to extract tags from text
const extractTags = (text: string): string[] => {
  const tagRegex = /#(\w+)/g;
  const matches = text.match(tagRegex);
  return matches ? matches.map(tag => tag.slice(1)) : [];
};

// Helper function to remove tags from text
const removeTagsFromText = (text: string): string => {
  return text.replace(/#\w+/g, '').trim();
};

// Auto-save hook
const useAutoSave = (value: string, saveFunction: (value: string) => void, delay: number = 1000) => {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim()) {
      timeoutRef.current = setTimeout(() => {
        setIsSaving(true);
        saveFunction(value);
        setTimeout(() => setIsSaving(false), 500);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, saveFunction, delay]);

  return isSaving;
};

// Sortable Todo Item Component
interface SortableTodoItemProps {
  todo: any;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onAddSubTodo: (parentId: string, todo: any) => void;
  onToggleSubTodo: (parentId: string, childId: string) => void;
  onDeleteSubTodo: (parentId: string, childId: string) => void;
  level?: number;
  view?: string;
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubTodo,
  onToggleSubTodo,
  onDeleteSubTodo,
  level = 0,
  view = 'all'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [showNotes, setShowNotes] = useState(false);
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');
  const [newNote, setNewNote] = useState(todo.notes || '');
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const subTaskInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Auto-save notes
  const isSavingNotes = useAutoSave(newNote, (value) => {
    onUpdate(todo.id, { notes: value });
  }, 1500);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(todo.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(todo.id, { content: editContent });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(todo.content);
  };

  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      onAddSubTodo(todo.id, {
        content: newSubTask,
        completed: false,
        priority: 'medium',
        tags: extractTags(newSubTask),
      });
      setNewSubTask('');
      setIsAddingSubTask(false);
    }
  };

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

  const completedSubTasks = todo.children?.filter((child: any) => child.completed).length || 0;
  const totalSubTasks = todo.children?.length || 0;
  const progressPercentage = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  // Determine if this is a "project" (has sub-tasks)
  const isProject = totalSubTasks > 0;

  // Show urgency indicators
  const isUrgent = isOverdue(todo.dueDate) || (isToday(todo.dueDate) && todo.priority === 'high');
  const isDueToday = isToday(todo.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-lg transition-all duration-300 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${level > 0 ? 'ml-8 border-l-4 border-l-blue-300' : ''} ${
        isProject ? 'border-blue-200 bg-blue-50/30' : ''
      } ${
        isUrgent ? 'border-red-300 bg-red-50/30' : 
        isDueToday ? 'border-yellow-300 bg-yellow-50/30' : 
        'border-gray-200'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} className="text-gray-400" />
          </div>

          {/* Project Icon */}
          {isProject && (
            <div className="flex-shrink-0 mt-1">
              <FolderOpen size={16} className="text-blue-600" />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={() => onToggle(todo.id)}
            className="flex-shrink-0 mt-1"
          >
            {todo.completed ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <CheckSquare size={20} className="text-gray-400 hover:text-green-600 transition-colors" />
            )}
          </button>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center space-x-2 mb-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm font-medium"
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mb-2">
                <h3 className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {todo.content}
                </h3>
                {isProject && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Project • {completedSubTasks}/{totalSubTasks} tasks completed
                  </p>
                )}
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                {getPriorityIcon(todo.priority)} {todo.priority}
              </span>
              
              {todo.dueDate && (
                <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                  isOverdue(todo.dueDate) ? 'bg-red-100 text-red-700' :
                  isToday(todo.dueDate) ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <Calendar size={12} />
                  <span>{formatDate(todo.dueDate)}</span>
                </span>
              )}
              
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {todo.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress indicator for projects */}
              {isProject && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <BarChart3 size={12} />
                  <span>{Math.round(progressPercentage)}% complete</span>
                </div>
              )}
            </div>

            {/* Progress bar for projects */}
            {isProject && (
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Notes Section */}
            {(todo.notes || isAddingNote) && (
              <div className="mb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900">Notes</span>
                    {isSavingNotes && (
                      <span className="text-xs text-blue-600 animate-pulse">Saving...</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showNotes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
                
                {isAddingNote ? (
                  <textarea
                    ref={noteInputRef}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add notes about this task..."
                    className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
                    rows={2}
                  />
                ) : showNotes && (
                  <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">{todo.notes}</p>
                )}
              </div>
            )}

            {/* Sub-tasks Section */}
            {todo.children && todo.children.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowSubTasks(!showSubTasks)}
                  className="flex items-center space-x-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {showSubTasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Sub-tasks ({completedSubTasks}/{totalSubTasks})</span>
                </button>
                
                {showSubTasks && (
                  <div className="mt-2 space-y-2 pl-4">
                    {todo.children.map((child: any) => (
                      <div key={child.id} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <button
                          onClick={() => onToggleSubTodo(todo.id, child.id)}
                          className="flex-shrink-0"
                        >
                          {child.completed ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                          ) : (
                            <CheckSquare size={16} className="text-gray-400 hover:text-green-600 transition-colors" />
                          )}
                        </button>
                        <span className={`flex-1 text-xs ${child.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {child.content}
                        </span>
                        <button
                          onClick={() => onDeleteSubTodo(todo.id, child.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Sub-task */}
            {isAddingSubTask ? (
              <div className="mb-3 flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <input
                  ref={subTaskInputRef}
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubTask();
                    if (e.key === 'Escape') setIsAddingSubTask(false);
                  }}
                  placeholder="Add sub-task..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                />
                <button
                  onClick={handleAddSubTask}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={() => setIsAddingSubTask(false)}
                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsAddingSubTask(true)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <Plus size={12} />
                  <span>Add sub-task</span>
                </button>
                
                {!todo.notes && (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    <FileText size={12} />
                    <span>Add notes</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit task"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToDoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');
  const [view, setView] = useState<'all' | 'today' | 'overdue' | 'projects'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, addSubTodo } = useMindnestStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter todos based on view, priority, and search
  const filteredTodos = todos.filter(todo => {
    if (view === 'today' && !isToday(todo.dueDate)) return false;
    if (view === 'overdue' && !isOverdue(todo.dueDate)) return false;
    if (view === 'projects' && (!todo.children || todo.children.length === 0)) return false;
    if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
    if (searchQuery && !todo.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                    (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
        break;
      case 'dueDate':
        if (a.dueDate && b.dueDate) {
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (a.dueDate) {
          comparison = -1;
        } else if (b.dueDate) {
          comparison = 1;
        }
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Group todos
  const incompleteTodos = sortedTodos.filter(todo => !todo.completed);
  const completedTodos = sortedTodos.filter(todo => todo.completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = incompleteTodos.findIndex(todo => todo.id === active.id);
      const newIndex = incompleteTodos.findIndex(todo => todo.id === over?.id);
      
      const newTodos = arrayMove(incompleteTodos, oldIndex, newIndex);
      
      newTodos.forEach((todo, index) => {
        updateTodo(todo.id, { order: index });
      });
    }
  };

  const handleToggleSubTodo = (parentId: string, childId: string) => {
    const parentTodo = todos.find(t => t.id === parentId);
    if (parentTodo) {
      const updatedChildren = parentTodo.children.map((child: any) =>
        child.id === childId ? { ...child, completed: !child.completed } : child
      );
      updateTodo(parentId, { children: updatedChildren });
    }
  };

  const handleDeleteSubTodo = (parentId: string, childId: string) => {
    const parentTodo = todos.find(t => t.id === parentId);
    if (parentTodo) {
      const updatedChildren = parentTodo.children.filter((child: any) => child.id !== childId);
      updateTodo(parentId, { children: updatedChildren });
    }
  };

  // Calculate statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const todayTasks = todos.filter(t => isToday(t.dueDate) && !t.completed).length;
  const overdueTasks = todos.filter(t => isOverdue(t.dueDate) && !t.completed).length;
  const projects = todos.filter(t => t.children && t.children.length > 0);
  const totalSubTasks = todos.reduce((total, todo) => total + (todo.children?.length || 0), 0);
  const completedSubTasks = todos.reduce((total, todo) => 
    total + (todo.children?.filter((child: any) => child.completed).length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Manager</h1>
          <p className="text-gray-600 font-medium">Organize your work into clear, manageable projects</p>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Target size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Done</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <CalendarDays size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <Clock size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{overdueTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FolderOpen size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Todo */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-todo" className="block text-lg font-medium text-gray-700 mb-3">
                Create a new task or project
              </label>
              <div className="flex space-x-3">
                <input
                  id="new-todo"
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="What needs to be done? Use #tags for organization"
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-lg"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!newTodo.trim() || isSubmitting}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Add Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All Tasks', icon: ListTodo },
              { id: 'today', label: 'Due Today', icon: CalendarDays },
              { id: 'overdue', label: 'Overdue', icon: Clock },
              { id: 'projects', label: 'Projects', icon: FolderOpen }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  view === id
                    ? 'bg-blue-100 text-blue-700 shadow-md border-2 border-blue-300'
                    : 'bg-white/80 text-gray-600 hover:text-gray-800 hover:bg-white border-2 border-transparent'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm font-medium"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="created">Sort by Created</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Todo Lists */}
        <div className="space-y-8">
          {/* Incomplete Todos */}
          {incompleteTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <Zap size={28} className="text-blue-600" />
                <span>Active Tasks</span>
                <span className="text-lg text-gray-500">({incompleteTodos.length})</span>
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={incompleteTodos.map(todo => todo.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {incompleteTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onUpdate={updateTodo}
                        onAddSubTodo={addSubTodo}
                        onToggleSubTodo={handleToggleSubTodo}
                        onDeleteSubTodo={handleDeleteSubTodo}
                        view={view}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <CheckCircle2 size={28} className="text-green-600" />
                <span>Completed</span>
                <span className="text-lg text-gray-500">({completedTodos.length})</span>
              </h2>
              <div className="space-y-4">
                {completedTodos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onUpdate={updateTodo}
                    onAddSubTodo={addSubTodo}
                    onToggleSubTodo={handleToggleSubTodo}
                    onDeleteSubTodo={handleDeleteSubTodo}
                    view={view}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTodos.length === 0 && (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200">
              <Target size={64} className="mx-auto text-blue-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-800 mb-3">No tasks found</h3>
              <p className="text-gray-600">
                {view === 'today' ? 'No tasks due today' : 
                 view === 'overdue' ? 'No overdue tasks' :
                 view === 'projects' ? 'No projects yet' : 
                 'Add your first task above'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 