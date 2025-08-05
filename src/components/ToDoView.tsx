import React, { useState } from 'react';
import { CheckSquare, Circle, CheckCircle, Edit2, Trash2, Search, Clock, Zap, Calendar, ArrowRight } from 'lucide-react';
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
    toggleTodo
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
      label: 'Urgent', 
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

  const TaskCard: React.FC<{ task: TodoItem }> = ({ task }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group">
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
    </div>
  );

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
                {activeUrgency === 'urgent' ? 'Great! No urgent tasks right now.' :
                 activeUrgency === 'today' ? 'All caught up for today!' :
                 'No tasks in this category yet.'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};