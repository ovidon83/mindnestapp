import React, { useState, useRef } from 'react';
import { CheckSquare, Circle, CheckCircle, Edit2, Trash2, Plus, Search, Calendar, Clock, Hash, ChevronDown, ChevronRight } from 'lucide-react';
import { useMindnestStore } from '../store';

type TaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

interface GroupedTask {
  id: string;
  content: string;
  source: 'thought' | 'todo';
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  completed: boolean;
  dueDate?: Date;
  timestamp: Date;
  tags: string[];
}

// Utility function to extract tags from content
const extractTagsFromContent = (content: string): { content: string; tags: string[] } => {
  const tagMatches = content.match(/#(\w+)/g) || [];
  const extractedTags = tagMatches.map(tag => tag.slice(1));
  const cleanContent = content.replace(/#\w+/g, '').trim();
  return { content: cleanContent, tags: extractedTags };
};

export const ToDoView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

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
  const aiTaggedTasks = thoughts.filter(thought => thought.type === 'todo');

  // Combine and normalize all tasks
  const allTasks: GroupedTask[] = [
    ...aiTaggedTasks.map(thought => {
      const { content, tags: extractedTags } = extractTagsFromContent(thought.content);
      const allTags = [...(thought.tags || []), ...extractedTags];
      
      return {
        ...thought,
        content,
        source: 'thought' as const,
        priority: thought.priority || 'medium',
        status: (thought.status || 'To Do') as TaskStatus,
        completed: thought.metadata?.completed || false,
        dueDate: thought.dueDate,
        timestamp: thought.timestamp,
        tags: allTags
      };
    }),
    ...todos.map(todo => {
      const { content, tags: extractedTags } = extractTagsFromContent(todo.content);
      const allTags = [...(todo.tags || []), ...extractedTags];
      
      return {
        ...todo,
        content,
        source: 'todo' as const,
        priority: todo.priority,
        status: todo.status || 'To Do',
        completed: todo.completed,
        dueDate: todo.dueDate,
        timestamp: todo.createdAt,
        tags: allTags
      };
    })
  ];

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    const matchesTag = !selectedTag || task.tags.includes(selectedTag);
    
    return matchesSearch && matchesPriority && matchesTag;
  });

  // Group tasks by tags
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    // If task has no tags, put it in "Untagged" group
    const taskTags = task.tags.length > 0 ? task.tags : ['Untagged'];
    
    taskTags.forEach(tag => {
      if (!groups[tag]) {
        groups[tag] = {
          'To Do': [],
          'In Progress': [],
          'Blocked': [],
          'Done': []
        };
      }
      groups[tag][task.status].push(task);
    });
    
    return groups;
  }, {} as Record<string, Record<TaskStatus, GroupedTask[]>>);

  // Get all unique tags for filter dropdown
  const allUniqueTags = Array.from(new Set(allTasks.flatMap(task => task.tags))).sort();

  const handleEdit = (task: GroupedTask) => {
    setEditingId(task.id);
    setEditContent(task.content);
    
    // Focus and set cursor position after state update
    setTimeout(() => {
      if (editTextareaRef.current) {
        const textarea = editTextareaRef.current;
        textarea.focus();
        // Set cursor to the end of the text
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }, 0);
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

  const handleDelete = (task: GroupedTask) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    if (task.source === 'thought') {
      deleteThought(task.id);
    } else {
      deleteTodo(task.id);
    }
  };

  const handleToggleComplete = (task: GroupedTask) => {
    if (task.source === 'thought') {
      const newStatus = task.completed ? 'To Do' : 'Done';
      updateThought(task.id, { 
        status: newStatus,
        metadata: { 
          completed: !task.completed 
        }
      });
    } else {
      toggleTodo(task.id);
    }
  };

  const handleStatusChange = (task: GroupedTask, newStatus: TaskStatus) => {
    const isCompleted = newStatus === 'Done';
    
    if (task.source === 'thought') {
      updateThought(task.id, { 
        status: newStatus,
        metadata: { 
          completed: isCompleted 
        }
      });
    } else {
      updateTodo(task.id, { 
        status: newStatus,
        completed: isCompleted
      });
    }
  };

  const handleAddNewTask = () => {
    if (!newTaskContent.trim()) return;
    
    const { content, tags } = extractTagsFromContent(newTaskContent.trim());
    
    addTodo({
      content,
      completed: false,
      priority: 'medium',
      status: 'To Do',
      tags
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 border-gray-300';
      case 'In Progress': return 'bg-blue-100 border-blue-300';
      case 'Blocked': return 'bg-red-100 border-red-300';
      case 'Done': return 'bg-green-100 border-green-300';
    }
  };

  const toggleGroupCollapse = (tag: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(tag)) {
      newCollapsed.delete(tag);
    } else {
      newCollapsed.add(tag);
    }
    setCollapsedGroups(newCollapsed);
  };

  const TaskCard: React.FC<{ task: GroupedTask }> = ({ task }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-all group ${
      task.completed ? 'opacity-60' : ''
    }`}>
      {editingId === task.id ? (
        <div className="space-y-2">
          <textarea
            defaultValue={task.content}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
            autoFocus
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
              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 flex-1">
              <button
                onClick={() => handleToggleComplete(task)}
                className="mt-0.5 p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                {task.completed ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : (
                  <Circle size={14} className="text-gray-400 hover:text-green-500" />
                )}
              </button>
              
              <div className="flex-1">
                <p className={`text-gray-800 leading-relaxed text-sm ${
                  task.completed ? 'line-through opacity-60' : ''
                }`}>
                  {task.content}
                </p>
                
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {/* Priority */}
                  <span className={`px-1.5 py-0.5 rounded-full border text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  
                  {/* Source */}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    task.source === 'thought' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {task.source === 'thought' ? 'AI' : 'Manual'}
                  </span>
                  
                  {/* Due date */}
                  {task.dueDate && (
                    <div className="flex items-center gap-0.5 text-xs text-gray-500">
                      <Calendar size={10} />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {/* Status selector */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    className={`text-xs px-1.5 py-0.5 rounded border ${getStatusColor(task.status)} cursor-pointer`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  <Clock size={10} className="inline mr-1" />
                  {new Date(task.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(task)}
              className="p-0.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => handleDelete(task)}
              className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const StatusColumn: React.FC<{ status: TaskStatus; tasks: GroupedTask[] }> = ({ status, tasks }) => (
    <div className={`rounded-lg border-2 border-dashed p-2 min-h-24 ${getStatusColor(status)}`}>
      <h4 className="font-medium text-sm mb-2 text-gray-700 flex items-center gap-1">
        {status}
        <span className="bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5">
          {tasks.length}
        </span>
      </h4>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <CheckSquare className="text-blue-600" size={32} />
            Task Board
          </h1>
          <p className="text-gray-600">
            Organize your tasks by tags and track their progress
          </p>
        </div>

        {/* Quick Add */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add a new task... (use #tags to organize)"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewTask();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleAddNewTask}
              disabled={!newTaskContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Tags</option>
              {allUniqueTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Grouped Tasks */}
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">No tasks yet!</h2>
            <p className="text-gray-600">
              Add your first task above using #tags to organize them into groups.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([tag, statusGroups]) => {
              const isCollapsed = collapsedGroups.has(tag);
              const totalTasks = Object.values(statusGroups).flat().length;
              
              return (
                <div key={tag} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Tag Header */}
                  <div 
                    className="bg-gray-50 border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroupCollapse(tag)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                        <Hash size={20} className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{tag}</h3>
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {totalTasks} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Columns */}
                  {!isCollapsed && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(['To Do', 'In Progress', 'Blocked', 'Done'] as TaskStatus[]).map(status => (
                          <StatusColumn 
                            key={status} 
                            status={status} 
                            tasks={statusGroups[status]}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};