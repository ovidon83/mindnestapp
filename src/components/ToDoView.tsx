import React, { useState } from 'react';
import { CheckSquare, Circle, CheckCircle, Edit2, Trash2, Search, Clock, Zap, Calendar, Plus, MessageSquare, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useMindnestStore, TodoItem } from '../store';

type UrgencyLevel = 'urgent' | 'today' | 'this_week' | 'later';

export const ToDoView: React.FC = () => {
  const [activeUrgency, setActiveUrgency] = useState<UrgencyLevel>('urgent');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const { 
    todos, 
    updateTodo, 
    deleteTodo, 
    toggleTodo,
    reorderTodos,
    addTodo
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
      label: 'Critical', 
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
      icon: CheckSquare, 
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

    // Update priority based on urgency
    const newPriority = newUrgency === 'urgent' ? 'high' : 
                       newUrgency === 'today' ? 'medium' : 'low';

    updateTodo(taskId, { 
      tags: newTags,
      priority: newPriority
    });
  };

  const handleEditNotes = (task: TodoItem) => {
    setEditingNotes(task.id);
    setNotesContent(task.notes || '');
  };

  const handleSaveNotes = () => {
    if (!editingNotes) return;
    updateTodo(editingNotes, { notes: notesContent });
    setEditingNotes(null);
    setNotesContent('');
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNotesContent('');
  };

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
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
    const isExpanded = expandedTasks.has(task.id);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group">
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
            {editingId === task.id ? (
              <div className="space-y-3">
                <input
                  value={editContent}
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
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Save size={14} />
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
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-gray-900 font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                    {task.content}
                  </p>
                  <button
                    onClick={() => toggleExpanded(task.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                    <Calendar size={12} />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}

                {/* Notes Section */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {editingNotes === task.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesContent}
                          onChange={(e) => setNotesContent(e.target.value)}
                          placeholder="Add notes..."
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNotes}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <Save size={12} />
                            Save Notes
                          </button>
                          <button
                            onClick={handleCancelNotes}
                            className="px-2 py-1 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {task.notes ? (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{task.notes}</p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No notes yet</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditNotes(task)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                          title="Edit notes"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
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
                <Zap size={16} />
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
              title="Edit task"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(task.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="text-blue-600" size={32} />
            Smart Tasks
          </h1>
          <p className="text-gray-600 mt-1">Simple, powerful task management with notes</p>
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
                {activeUrgency === 'urgent' ? 'Great! Nothing urgent right now.' :
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