import React, { useState } from 'react';
import { useAllyMindStore } from '../store';
import { 
  Plus, 
  Search, 
  Star, 
  Circle, 
 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight,

  Target,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';

const HomeView: React.FC = () => {
  const {
    entries,
    setCurrentView,
    toggleEntryComplete,
    toggleEntryPin,
    deleteEntry,
    editEntryTitle,
    editEntryBody,
    addSubTask,
    toggleSubTask,
    getDailyTop3,
    getWeeklyReview,
    reorderEntries,
    setSearchQuery
  } = useAllyMindStore();

  const [activeView, setActiveView] = useState<'tasks' | 'thoughts'>('tasks');
  const [searchQuery, setSearchQueryLocal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);

  // Get AI insights
  const dailyTop3 = getDailyTop3();
  const weeklyReview = getWeeklyReview();

  // Filter entries based on active view
  const filteredEntries = entries.filter(entry => {
    if (activeView === 'tasks') return entry.type === 'task';
    if (activeView === 'thoughts') return entry.type === 'thought';
    return true;
  });

  // Group entries by time bucket
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const bucket = entry.timeBucket || 'none';
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const handleEdit = (entry: typeof entries[0]) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditBody(entry.body);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      editEntryTitle(editingId, editTitle.trim());
      if (editBody.trim()) {
        editEntryBody(editingId, editBody.trim());
      }
      setEditingId(null);
      setEditTitle('');
      setEditBody('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const toggleGroupCollapsed = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    setDraggedEntryId(entryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetEntryId: string) => {
    e.preventDefault();
    if (draggedEntryId && draggedEntryId !== targetEntryId) {
      // Reorder entries
      const currentOrder = filteredEntries.map(entry => entry.id);
      const draggedIndex = currentOrder.indexOf(draggedEntryId);
      const targetIndex = currentOrder.indexOf(targetEntryId);
      
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedEntryId);
      
      reorderEntries(newOrder);
    }
    setDraggedEntryId(null);
  };

  const getTimeBucketLabel = (bucket: string) => {
    switch (bucket) {
      case 'overdue': return '🚨 Overdue';
      case 'today': return '📅 Today';
      case 'tomorrow': return '🌅 Tomorrow';
      case 'this_week': return '📆 This Week';
      case 'next_week': return '⏭️ Next Week';
      case 'later': return '⏳ Later';
      case 'someday': return '💭 Someday';
      default: return '📝 No Due Date';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">AllyMind</h1>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('tasks')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'tasks'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveView('thoughts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'thoughts'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thoughts
              </button>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('capture')}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Entry</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQueryLocal(e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* AI Insights Section */}
      {activeView === 'tasks' && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Top 3 */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Today's Top 3</h3>
              </div>
              {dailyTop3.length > 0 ? (
                <div className="space-y-2">
                  {dailyTop3.map((entry, index) => (
                    <div key={entry.id} className="flex items-center space-x-2 text-sm">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-700">{entry.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No priority tasks for today</p>
              )}
            </div>

            {/* Weekly Review */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Weekly Review</h3>
              </div>
              <div className="space-y-2 text-sm">
                {weeklyReview.critical.length > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>{weeklyReview.critical.length} critical items</span>
                  </div>
                )}
                {weeklyReview.postponed.length > 0 && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>{weeklyReview.postponed.length} postponed items</span>
                  </div>
                )}
                {weeklyReview.forgotten.length > 0 && (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                    <span>{weeklyReview.forgotten.length} forgotten items</span>
                  </div>
                )}
                {weeklyReview.critical.length === 0 && weeklyReview.postponed.length === 0 && weeklyReview.forgotten.length === 0 && (
                  <p className="text-slate-500">All caught up this week!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([bucket, bucketEntries]) => (
            <div key={bucket} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Group Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleGroupCollapsed(bucket)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {collapsedGroups.has(bucket) ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {getTimeBucketLabel(bucket)}
                  </h3>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-sm font-medium">
                    {bucketEntries.length}
                  </span>
                </div>
              </div>

              {/* Group Content */}
              {!collapsedGroups.has(bucket) && (
                <div className="p-4 space-y-3">
                  {bucketEntries.map((entry) => (
                    <div
                      key={entry.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, entry.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, entry.id)}
                      className={`bg-slate-50 rounded-lg border border-slate-200 transition-all duration-200 ${
                        draggedEntryId === entry.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Entry Header */}
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Task completion status */}
                          {entry.type === 'task' && (
                            <button
                              onClick={() => toggleEntryComplete(entry.id)}
                              className={`w-5 h-5 rounded-full border-2 transition-colors mt-1 ${
                                entry.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                              title={entry.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {entry.completed && (
                                <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto mt-0.5"></div>
                              )}
                            </button>
                          )}

                          {/* Type indicator for thoughts */}
                          {entry.type === 'thought' && (
                            <div className="w-5 h-5 text-blue-500 mt-1">
                              <Circle className="w-5 h-5" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {editingId === entry.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Entry title"
                                />
                                <textarea
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Entry body (optional)"
                                  rows={2}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-400 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h3 
                                  className={`text-base font-medium text-slate-900 ${
                                    entry.completed ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {entry.title}
                                </h3>
                                
                                {entry.body && (
                                  <p className="text-sm text-slate-600 mt-1">{entry.body}</p>
                                )}

                                {/* Tags and Priority */}
                                <div className="flex items-center space-x-2 mt-2">
                                  {entry.priority && (
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(entry.priority)}`}>
                                      {entry.priority}
                                    </span>
                                  )}
                                  
                                  {entry.tags.map((tag) => (
                                    <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Due Date */}
                                {entry.dueAt && (
                                  <div className="flex items-center space-x-1 mt-2 text-sm text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDate(entry.dueAt)}</span>
                                  </div>
                                )}

                                {/* Progress Bar for Tasks */}
                                {entry.type === 'task' && entry.subTasks && entry.subTasks.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                                      <span>Progress</span>
                                      <span>{entry.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${entry.progress || 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => toggleExpanded(entry.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Toggle details"
                            >
                              {expandedEntries.has(entry.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit entry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => toggleEntryPin(entry.id)}
                              className={`p-1 transition-colors ${
                                entry.pinned 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                              title={entry.pinned ? 'Unpin entry' : 'Pin entry'}
                            >
                              <Star className="w-4 h-4" fill={entry.pinned ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedEntries.has(entry.id) && (
                        <div className="px-4 pb-4 border-t border-slate-100">
                          {/* AI Note */}
                          {entry.note && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                <h4 className="font-medium text-blue-900">AI Insight</h4>
                              </div>
                              <p className="text-sm text-blue-800">{entry.note}</p>
                            </div>
                          )}

                          {/* Sub-tasks */}
                          {entry.type === 'task' && entry.subTasks && entry.subTasks.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-slate-900 mb-3">Sub-tasks</h4>
                              <div className="space-y-2">
                                {entry.subTasks.map((subTask) => (
                                  <div key={subTask.id} className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleSubTask(entry.id, subTask.id)}
                                      className={`w-4 h-4 rounded border-2 transition-colors ${
                                        subTask.completed 
                                          ? 'bg-green-500 border-green-500' 
                                          : 'border-slate-300 hover:border-slate-400'
                                      }`}
                                    >
                                      {subTask.completed && (
                                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                      )}
                                    </button>
                                    <span 
                                      className={`text-sm ${
                                        subTask.completed ? 'line-through text-slate-500' : 'text-slate-700'
                                      }`}
                                    >
                                      {subTask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Sub-task */}
                          {entry.type === 'task' && (
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  const newTitle = prompt('Enter sub-task title:');
                                  if (newTitle && newTitle.trim()) {
                                    addSubTask(entry.id, newTitle.trim());
                                  }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                + Add sub-task
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Circle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No {activeView === 'tasks' ? 'tasks' : 'thoughts'} yet
            </h3>
            <p className="text-slate-500 mb-4">
              Start by adding your first {activeView === 'tasks' ? 'task' : 'thought'} in the capture view.
            </p>
            <button
              onClick={() => setCurrentView('capture')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add Your First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
