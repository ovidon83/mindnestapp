import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Calendar,
  Target,
  Search
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

export const ToDoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');
  const [view, setView] = useState<'all' | 'today'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { todos, addTodo, toggleTodo, deleteTodo } = useMindnestStore();

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">To-Do List</h1>
        <p className="text-gray-600">Organize your tasks and get things done</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <div className="space-y-2">
              {incompleteTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="flex-shrink-0 mt-1"
                    >
                      <CheckSquare size={20} className="text-gray-400 hover:text-green-600 transition-colors" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">{todo.content}</p>
                      
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
                            {todo.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed</h2>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 size={20} className="text-green-600 mt-1" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 line-through">{todo.content}</p>
                      
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
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
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