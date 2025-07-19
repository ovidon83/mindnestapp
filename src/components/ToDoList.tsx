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
  List
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
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubTodo,
  onToggleSubTodo,
  onDeleteSubTodo,
  level = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [showNotes, setShowNotes] = useState(false);
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');
  const [newNote, setNewNote] = useState('');
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

  const handleAddNote = () => {
    if (newNote.trim()) {
      onUpdate(todo.id, { notes: newNote });
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${level > 0 ? 'ml-6 border-l-2 border-l-blue-200' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>

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
            <div className="flex items-center space-x-2">
              <input
                ref={editInputRef}
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Save size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className={`text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.content}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center space-x-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
              {getPriorityIcon(todo.priority)} {todo.priority}
            </span>
            
            {todo.dueDate && (
              <span className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar size={12} />
                <span>{formatDate(todo.dueDate)}</span>
              </span>
            )}
            
            {todo.tags && todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {todo.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Sub-tasks progress */}
            {totalSubTasks > 0 && (
              <span className="flex items-center space-x-1 text-xs text-gray-500">
                <List size={12} />
                <span>{completedSubTasks}/{totalSubTasks}</span>
              </span>
            )}
          </div>

          {/* Progress bar for sub-tasks */}
          {totalSubTasks > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes Section */}
          {todo.notes && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={14} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Notes</span>
                </div>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showNotes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
              {showNotes && (
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{todo.notes}</p>
              )}
            </div>
          )}

          {/* Sub-tasks Section */}
          {todo.children && todo.children.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSubTasks(!showSubTasks)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {showSubTasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Sub-tasks ({completedSubTasks}/{totalSubTasks})</span>
              </button>
              
              {showSubTasks && (
                <div className="mt-2 space-y-2">
                  {todo.children.map((child: any) => (
                    <div key={child.id} className="flex items-center space-x-2 pl-4">
                      <button
                        onClick={() => onToggleSubTodo(todo.id, child.id)}
                        className="flex-shrink-0"
                      >
                        {child.completed ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <CheckSquare size={16} className="text-gray-400 hover:text-green-600" />
                        )}
                      </button>
                      <span className={`text-sm ${child.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {child.content}
                      </span>
                      <button
                        onClick={() => onDeleteSubTodo(todo.id, child.id)}
                        className="text-gray-400 hover:text-red-600"
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
            <div className="mt-3 flex items-center space-x-2">
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
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddSubTask}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Save size={14} />
              </button>
              <button
                onClick={() => setIsAddingSubTask(false)}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center space-x-4">
              <button
                onClick={() => setIsAddingSubTask(true)}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Plus size={12} />
                <span>Add sub-task</span>
              </button>
              
              {!todo.notes && (
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <FileText size={12} />
                  <span>Add note</span>
                </button>
              )}
            </div>
          )}

          {/* Add Note */}
          {isAddingNote && (
            <div className="mt-3">
              <textarea
                ref={noteInputRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add notes about this task..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={handleAddNote}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Note
                </button>
                <button
                  onClick={() => setIsAddingNote(false)}
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
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
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToDoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');
  const [view, setView] = useState<'all' | 'today'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
    if (searchQuery && !todo.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group todos
  const incompleteTodos = filteredTodos.filter(todo => !todo.completed);
  const completedTodos = filteredTodos.filter(todo => todo.completed);

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
      
      // Reorder the todos array
      const newTodos = arrayMove(incompleteTodos, oldIndex, newIndex);
      
      // Update the store with the new order
      // Note: This is a simplified approach. In a real app, you might want to add an 'order' field to todos
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



  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">To-Do List</h1>
        <p className="text-gray-600">Organize your tasks with drag & drop, notes, and sub-tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Target size={20} className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{todos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{todos.filter(t => t.completed).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Clock size={20} className="text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">{todos.filter(t => isToday(t.dueDate)).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <List size={20} className="text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Sub-tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {todos.reduce((total, todo) => total + (todo.children?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Todo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-todo" className="block text-sm font-medium text-gray-700 mb-2">
              Add a new task
            </label>
            <div className="flex space-x-2">
              <input
                id="new-todo"
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done? Use #tags for organization"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!newTodo.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'today'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Due Today
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Todo Lists */}
      <div className="space-y-6">
        {/* Incomplete Todos */}
        {incompleteTodos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">To Do</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={incompleteTodos.map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed</h2>
            <div className="space-y-2">
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
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTodos.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {view === 'today' ? 'No tasks due today' : 'Add your first task above'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 