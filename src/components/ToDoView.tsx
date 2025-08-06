import React, { useState } from 'react';

// Drag and drop
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Circle, CheckCircle, Edit2, Trash2, Search, Clock, Zap, Calendar, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useMindnestStore } from '../store';
import { TodoItem } from '../store';

type UrgencyLevel = 'urgent' | 'today' | 'this_week' | 'later';

export const ToDoView: React.FC = () => {
  const [activeUrgency, setActiveUrgency] = useState<UrgencyLevel>('urgent');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { 
    todos, 
    updateTodo, 
    deleteTodo, 
    toggleTodo,
    reorderTodos
  } = useMindnestStore();

  // Filter todos by urgency
  const getTasksByUrgency = (urgency: UrgencyLevel) => {
    const today = new Date().toDateString();
    
    return todos.filter(todo => {
      if (todo.completed) return false;
      
      const dueDateStr = todo.dueDate ? (todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate)).toDateString() : null;
      
      switch (urgency) {
        case 'urgent':
          return todo.tags?.includes('urgent') || todo.priority === 'high';
        case 'today':
          return todo.tags?.includes('today') || dueDateStr === today;
        case 'this_week':
          return todo.tags?.includes('this_week') || todo.tags?.includes('week');
        case 'later':
          return !todo.tags?.includes('urgent') && 
                 !todo.tags?.includes('today') && 
                 !todo.tags?.includes('this_week') &&
                 dueDateStr !== today &&
                 todo.priority !== 'high';
        default:
          return false;
      }
    });
  };

  const filteredTasks = getTasksByUrgency(activeUrgency).filter(task =>
    task.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const urgencyLevels = [
    { 
      key: 'urgent' as UrgencyLevel, 
      label: 'Now', 
      icon: Zap, 
      color: 'red',
      count: getTasksByUrgency('urgent').length
    },
    { 
      key: 'today' as UrgencyLevel, 
      label: 'Today', 
      icon: Clock, 
      color: 'orange',
      count: getTasksByUrgency('today').length
    },
    { 
      key: 'this_week' as UrgencyLevel, 
      label: 'This Week', 
      icon: Calendar, 
      color: 'blue',
      count: getTasksByUrgency('this_week').length
    },
    { 
      key: 'later' as UrgencyLevel, 
      label: 'Later', 
      icon: ArrowRight, 
      color: 'gray',
      count: getTasksByUrgency('later').length
    },
  ];

  const handleEdit = (task: TodoItem) => {
    setEditingId(task.id);
    setEditContent(task.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateTodo(editingId, { content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (taskId: string) => {
    deleteTodo(taskId);
  };

  const handleChangeUrgency = (taskId: string, newUrgency: UrgencyLevel) => {
    const task = todos.find(t => t.id === taskId);
    if (!task) return;

    // Remove old urgency tags and add new ones
    let newTags = (task.tags || []).filter(tag => 
      !['urgent', 'today', 'this_week', 'week'].includes(tag)
    );

    // Add new urgency tag
    if (newUrgency === 'urgent') {
      newTags.push('urgent');
    } else if (newUrgency === 'today') {
      newTags.push('today');
    } else if (newUrgency === 'this_week') {
      newTags.push('this_week');
    }
    // 'later' doesn't need a specific tag

    // Update priority based on urgency
    const newPriority = newUrgency === 'urgent' ? 'high' : 
                       newUrgency === 'today' ? 'medium' : 'low';

    updateTodo(taskId, { 
      tags: newTags,
      priority: newPriority
    });
  };

  const TaskCard: React.FC<{ task: TodoItem }> = ({ task }) => {
    const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
    
    const getCurrentUrgency = (): UrgencyLevel => {
      if (task.tags?.includes('urgent') || task.priority === 'high') return 'urgent';
      if (task.tags?.includes('today')) return 'today';
      if (task.tags?.includes('this_week') || task.tags?.includes('week')) return 'this_week';
      return 'later';
    };

    const currentUrgency = getCurrentUrgency();
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group relative">
        {editingId === task.id ? (
          <div className="space-y-3">
            <input
              key={task.id}
              defaultValue={task.content}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
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
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleTodo(task.id)}
              className="mt-1 flex-shrink-0"
            >
              {task.completed ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <Circle size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-gray-900 ${task.completed ? 'line-through opacity-60' : ''}`}>
                {task.content}
              </p>
              
              {task.tags && task.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      #{tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Urgency Change Button */}
              <div className="relative">
                <button
                  onClick={() => setShowUrgencyMenu(!showUrgencyMenu)}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                  title="Change urgency"
                >
                  <ArrowUpRight size={16} />
                </button>
                
                {showUrgencyMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                    {urgencyLevels.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => {
                          handleChangeUrgency(task.id, key);
                          setShowUrgencyMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          currentUrgency === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                        {currentUrgency === key && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleEdit(task)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Click outside to close menu */}
        {showUrgencyMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowUrgencyMenu(false)}
          />
        )}
      </div>
    );
  };

  // ----- Drag & Drop (dnd-kit) -----
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedIds = arrayMove(filteredTasks.map(t => t.id), oldIndex, newIndex);
    reorderTodos(newOrderedIds);
  };

  const SortableTaskCard: React.FC<{ task: TodoItem }> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <TaskCard task={task} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="text-blue-600" size={32} />
            To-Do
          </h1>
          <p className="text-gray-600 mt-1">Organize tasks by urgency and priority</p>
        </div>

        {/* Urgency Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {urgencyLevels.map(({ key, label, icon: Icon, color, count }) => (
              <button
                key={key}
                onClick={() => setActiveUrgency(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeUrgency === key
                    ? `bg-${color}-100 text-${color}-700 shadow-sm`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
                {count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeUrgency === key
                      ? `bg-${color}-200 text-${color}-800`
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <CheckSquare size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {urgencyLevels.find(u => u.key === activeUrgency)?.label.toLowerCase()} tasks
              </h3>
              <p className="text-gray-600">
                {activeUrgency === 'urgent' ? 'Great! Nothing to do now – nice!' :
                 activeUrgency === 'today' ? 'All caught up for today!' :
                 'No tasks in this category yet.'}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {filteredTasks.map(task => (
                  <SortableTaskCard key={task.id} task={task} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};