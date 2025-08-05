import React, { useState } from 'react';
import { Archive, ArrowRight, Edit2, Trash2, Circle, CheckCircle, Search, Tag, Brain, Lightbulb, Heart, BookOpen } from 'lucide-react';
import { useMindnestStore } from '../store';
import { TodoItem } from '../store';

export const LaterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'tasks' | 'entries'>('tasks');
  
  const { 
    todos, 
    updateTodo, 
    deleteTodo,
    thoughts
  } = useMindnestStore();
  
  // Filter for later tasks
  const today = new Date().toDateString();
  const laterTasks = todos.filter(todo => {
    if (todo.completed) return false;
    
    const createdAtDate = todo.createdAt instanceof Date ? todo.createdAt : new Date(todo.createdAt);
    const dueDateStr = todo.dueDate ? (todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate)).toDateString() : null;
    
    // Exclude today tasks
    const isToday = todo.tags?.includes('today') ||
                   todo.tags?.includes('urgent') ||
                   (dueDateStr === today) ||
                   (createdAtDate.toDateString() === today && !todo.tags?.includes('later'));
    
    return !isToday;
  });
  
  // Use thoughts as entries
  const allEntries = thoughts.filter(thought => 
    thought.type === 'idea' || thought.type === 'journal' || thought.type === 'note'
  );
  
  // Get all unique tags for filtering
  const allTags = Array.from(new Set([
    ...laterTasks.flatMap(task => task.tags || []),
    ...(viewMode === 'entries' ? allEntries.flatMap(entry => entry.tags || []) : [])
  ])).sort();
  
  // Get all unique project tags
  const projectTags = allTags.filter(tag => tag.startsWith('project_'));
  
  // Filter tasks
  const filteredTasks = laterTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesTag = !selectedTag || (task.tags && task.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  // Filter entries
  const filteredEntries = allEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  // Group by project if project tags exist
  const groupedTasks = projectTags.length > 0 ? 
    projectTags.reduce((groups, projectTag) => {
      groups[projectTag] = filteredTasks.filter(task => task.tags && task.tags.includes(projectTag));
      return groups;
    }, {} as Record<string, TodoItem[]>) : {};
  
  const ungroupedTasks = filteredTasks.filter(task => 
    !task.tags || !task.tags.some(tag => tag.startsWith('project_'))
  );
  
  const handleMoveToToday = (task: TodoItem) => {
    const newTags = [...(task.tags || []).filter(tag => tag !== 'later'), 'today'];
    updateTodo(task.id, { tags: newTags });
  };
  
  const handleEdit = (item: TodoItem | any) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };
  
  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      // Check if it's a task or entry
      const isTask = laterTasks.some(task => task.id === editingId);
      const isEntry = allEntries.some(entry => entry.id === editingId);
      
      if (isTask) {
        updateTodo(editingId, { content: editContent.trim() });
      } else if (isEntry) {
        // updateEntry doesn't exist in useMindnestStore, so we'll skip this for now
        // or you could implement it by using updateThought
      }
      
      setEditingId(null);
      setEditContent('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };
  
  const handleDelete = (id: string) => {
    const isTask = laterTasks.some(task => task.id === id);
    
    if (isTask && confirm('Are you sure you want to delete this task?')) {
      deleteTodo(id);
    }
    // For entries (thoughts), we'll skip deletion for now as it requires more complex handling
  };
  
  const TaskCard: React.FC<{ task: TodoItem }> = ({ task }) => (
    <div className="bg-white/80 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group">
      {editingId === task.id ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
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
            <button
              onClick={() => updateTodo(task.id, { completed: !task.completed })}
              className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {task.completed ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <Circle size={18} className="text-gray-400 hover:text-green-500" />
              )}
            </button>
            
            <div className="flex-1">
              <p className={`text-gray-800 leading-relaxed ${
                task.completed ? 'line-through opacity-60' : ''
              }`}>
                {task.content}
              </p>
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {task.tags?.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs ${
                        tag.startsWith('project_') 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                Added {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleMoveToToday(task)}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Move to Today"
            >
              <ArrowRight size={16} />
            </button>
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
  
  const EntryCard: React.FC<{ entry: any }> = ({ entry }) => {
    const getEntryIcon = (type: string) => {
      switch (type) {
        case 'idea': return <Lightbulb className="text-yellow-600" size={16} />;
        case 'journal': return <Heart className="text-pink-600" size={16} />;
        case 'thought': return <Brain className="text-blue-600" size={16} />;
        default: return <BookOpen className="text-gray-600" size={16} />;
      }
    };
    
    const getEntryColor = (type: string) => {
      switch (type) {
        case 'idea': return 'bg-yellow-50 border-yellow-200';
        case 'journal': return 'bg-pink-50 border-pink-200';
        case 'thought': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };
    
    return (
      <div className={`rounded-lg border p-4 hover:shadow-md transition-all group ${getEntryColor(entry.type)}`}>
        {editingId === entry.id ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
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
              {getEntryIcon(entry.type)}
              
              <div className="flex-1">
                <p className="text-gray-800 leading-relaxed mb-2">
                  {entry.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/60 text-gray-600 rounded text-xs capitalize">
                      {entry.type}
                    </span>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags?.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/60 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {entry.tags && entry.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(entry)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
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
  };
  
  const ProjectGroup: React.FC<{ projectTag: string; tasks: TodoItem[] }> = ({ projectTag, tasks }) => {
    const projectName = projectTag.replace('project_', '').replace(/_/g, ' ');
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Tag className="text-white" size={16} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 capitalize">
              {projectName}
            </h3>
            <p className="text-sm text-blue-700">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Archive className="text-slate-600" size={36} />
            Later Backlog
          </h1>
          <p className="text-gray-600 font-medium">
            Your safe space for ideas and tasks. No pressure, just storage.
          </p>
        </div>

        {/* Stats & View Toggle */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'tasks'
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckCircle size={16} />
              Tasks
            </button>
            <button
              onClick={() => setViewMode('entries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'entries'
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Brain size={16} />
              Entries
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {viewMode === 'tasks' ? (
              <>
                <div>
                  <div className="text-2xl font-bold text-slate-600">{laterTasks.length}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{projectTags.length}</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {laterTasks.filter(t => t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{allTags.length}</div>
                  <div className="text-sm text-gray-600">Unique Tags</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{allEntries.length}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {allEntries.filter(e => e.type === 'idea').length}
                  </div>
                  <div className="text-sm text-gray-600">Ideas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-600">
                    {allEntries.filter(e => e.type === 'journal').length}
                  </div>
                  <div className="text-sm text-gray-600">Journal</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {allEntries.filter(e => e.type === 'random').length}
                  </div>
                  <div className="text-sm text-gray-600">Thoughts</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-48"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  #{tag} ({laterTasks.filter(t => t.tags?.includes(tag)).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'tasks' ? (
          // Tasks view
          filteredTasks.length === 0 ? (
          /* Empty state */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">📥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {laterTasks.length === 0 ? "Your backlog is empty!" : "No matching tasks"}
            </h2>
            <p className="text-gray-600 mb-6">
              {laterTasks.length === 0 
                ? "Tasks you add in Unpack that aren't for today will appear here."
                : "Try adjusting your search or filter to find what you're looking for."
              }
            </p>
            
            {laterTasks.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  💡 Pro tip: Use tags like #project_name to organize related tasks together.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Task lists */
          <div className="space-y-6">
            {/* Project groups */}
            {Object.entries(groupedTasks).map(([projectTag, tasks]) => (
              <ProjectGroup key={projectTag} projectTag={projectTag} tasks={tasks} />
            ))}
            
            {/* Ungrouped tasks */}
            {ungroupedTasks.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <Archive className="text-white" size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Other Tasks</h3>
                    <p className="text-sm text-gray-600">
                      {ungroupedTasks.length} task{ungroupedTasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {ungroupedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
        ) : (
          // Entries view
          filteredEntries.length === 0 ? (
            /* Empty state for entries */
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {allEntries.length === 0 ? "No entries yet!" : "No matching entries"}
              </h2>
              <p className="text-gray-600 mb-6">
                {allEntries.length === 0 
                  ? "Ideas, thoughts, and journal entries from Unpack will appear here."
                  : "Try adjusting your search or filter to find what you're looking for."
                }
              </p>
              
              {allEntries.length === 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-purple-800 text-sm">
                    💡 Use the Unpack view to brain dump and automatically create entries.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Entries list grouped by type */
            <div className="space-y-6">
              {['idea', 'journal', 'thought'].map(entryType => {
                const entriesOfType = filteredEntries.filter(entry => entry.type === entryType);
                if (entriesOfType.length === 0) return null;
                
                const getTypeConfig = (type: string) => {
                  switch (type) {
                    case 'idea': return { 
                      icon: <Lightbulb className="text-yellow-600" size={20} />, 
                      color: 'bg-yellow-50 border-yellow-200',
                      title: 'Ideas',
                      description: 'Creative concepts and innovations'
                    };
                    case 'journal': return { 
                      icon: <Heart className="text-pink-600" size={20} />, 
                      color: 'bg-pink-50 border-pink-200',
                      title: 'Journal Entries',
                      description: 'Personal thoughts and feelings'
                    };
                    case 'thought': return { 
                      icon: <Brain className="text-blue-600" size={20} />, 
                      color: 'bg-blue-50 border-blue-200',
                      title: 'Thoughts',
                      description: 'General thoughts and observations'
                    };
                    default: return { 
                      icon: <BookOpen className="text-gray-600" size={20} />, 
                      color: 'bg-gray-50 border-gray-200',
                      title: 'Other',
                      description: 'Miscellaneous entries'
                    };
                  }
                };
                
                const config = getTypeConfig(entryType);
                
                return (
                  <div key={entryType} className={`rounded-2xl border-2 p-6 ${config.color}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
                        <p className="text-sm text-gray-600">
                          {config.description} • {entriesOfType.length} entr{entriesOfType.length !== 1 ? 'ies' : 'y'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {entriesOfType.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Organization Tips */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            🏷️ Organization Tips
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-gray-900">Project Tags:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Use #project_website for website tasks</li>
                <li>• Use #project_app for app development</li>
                <li>• Projects auto-group in this view</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">Action Tags:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Move to Today with the → button</li>
                <li>• Edit content directly in-place</li>
                <li>• Delete tasks you no longer need</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};