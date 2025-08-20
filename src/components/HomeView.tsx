import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Star, 
  Clock, 
  Calendar, 
  Target, 
  TrendingUp,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Brain,
  Heart,
  MessageCircle,
  Tag,
  ArrowUp
} from 'lucide-react';
import { useAllyMindStore } from '../store';
import { Entry, EntryType, Priority } from '../types';

export const HomeView: React.FC = () => {
  const { 
    entries, 
    updateEntry, 
    deleteEntry: storeDeleteEntry, 
    setCurrentView,
    appState,
    setSearchQuery,
    setActiveFilters
  } = useAllyMindStore();



  // Smart Home View State
  const [expandedSections, setExpandedSections] = useState({
    urgent: true,
    today: true,
    thisWeek: true,
    insights: true,
    ideas: true,  // New section for ideas
    journal: true, // New section for journal entries
    later: true,  // Changed to true so users can see entries
    done: false
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'type' | 'created'>('priority');
  const [showInsights, setShowInsights] = useState(true);

  // Smart Assistant State
  const [smartNudges, setSmartNudges] = useState<any[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
  const [patternInsights, setPatternInsights] = useState<any[]>([]);

  // Get search query and filters from store
  const searchQuery = appState.searchQuery;
  const activeFilters = appState.activeFilters;

  // Generate smart insights and nudges
  useEffect(() => {
    generateSmartInsights();
    generateSmartNudges();
    checkOverdueItems();
  }, [entries]);

  // Smart Insights Engine
  const generateSmartInsights = () => {
    const insights = [];
    
    // Pattern detection
    const stressMentions = entries.filter(entry => 
      entry.content.toLowerCase().includes('stress') || 
      entry.content.toLowerCase().includes('overwhelmed') ||
      entry.content.toLowerCase().includes('burned out')
    );
    
    if (stressMentions.length >= 3) {
      insights.push({
        type: 'pattern',
        title: 'Stress Pattern Detected',
        message: `You've mentioned stress ${stressMentions.length} times recently. Consider taking a break or reflecting on what's causing this.`,
        severity: 'medium',
        action: 'reflect',
        icon: Heart,
        color: 'text-orange-500'
      });
    }

    // Workload analysis
    const pendingTasks = entries.filter(entry => 
      entry.type === 'task' && entry.status === 'pending'
    );
    
    if (pendingTasks.length > 10) {
      insights.push({
        type: 'workload',
        title: 'High Task Load',
        message: `You have ${pendingTasks.length} pending tasks. Consider prioritizing or delegating some items.`,
        severity: 'high',
        action: 'prioritize',
        icon: Target,
        color: 'text-red-500'
      });
    }

    // Priority distribution
    const urgentTasks = pendingTasks.filter(task => task.priority === 'urgent');
    if (urgentTasks.length > 5) {
      insights.push({
        type: 'priority',
        title: 'Too Many Urgent Items',
        message: `${urgentTasks.length} urgent tasks might indicate poor planning. Consider setting realistic deadlines.`,
        severity: 'high',
        action: 'plan',
        icon: Calendar,
        color: 'text-red-500'
      });
    }

    // Reflection patterns
    const reflections = entries.filter(entry => entry.type === 'reflection');
    if (reflections.length === 0 && entries.length > 5) {
      insights.push({
        type: 'reflection',
        title: 'Time to Reflect',
        message: 'You have many entries but no reflections. Consider taking time to process your thoughts.',
        severity: 'low',
        action: 'reflect',
        icon: Brain,
        color: 'text-blue-500'
      });
    }

    setPatternInsights(insights);
  };

  // Smart Assistant - Generate contextual nudges
  const generateSmartNudges = () => {
    const nudges = [];
    const now = new Date();
    
    // Deadline reminders
    entries.forEach(entry => {
      if (entry.dueDate && entry.isDeadline && entry.status !== 'completed') {
        const timeUntilDue = entry.dueDate.getTime() - now.getTime();
        const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
        
        if (hoursUntilDue <= 2 && hoursUntilDue > 0) {
          nudges.push({
            type: 'deadline',
            title: 'Deadline Approaching',
            message: `"${entry.content}" is due in ${Math.floor(hoursUntilDue)} hours`,
            entryId: entry.id,
            severity: 'urgent',
            action: 'complete',
            icon: Clock,
            color: 'text-red-500'
          });
        } else if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
          nudges.push({
            type: 'deadline',
            title: 'Due Tomorrow',
            message: `"${entry.content}" is due tomorrow`,
            entryId: entry.id,
            severity: 'high',
            action: 'plan',
            icon: Calendar,
            color: 'text-orange-500'
          });
        }
      }
    });

    // Context-aware suggestions
    const todayEntries = entries.filter(entry => {
      if (entry.pinnedForDate) {
        return entry.pinnedForDate.toDateString() === now.toDateString();
      }
      if (entry.dueDate && entry.isDeadline) {
        return entry.dueDate.toDateString() === now.toDateString();
      }
      return false;
    });

    if (todayEntries.length === 0) {
      nudges.push({
        type: 'suggestion',
        title: 'No Focus for Today',
        message: 'You haven\'t set any priorities for today. What would you like to accomplish?',
        severity: 'low',
        action: 'plan',
        icon: Target,
        color: 'text-blue-500'
      });
    }

    // Tag-based suggestions
    const workEntries = entries.filter(entry => 
      entry.tags.some(tag => tag.toLowerCase().includes('work'))
    );
    
    if (workEntries.length > 0 && workEntries.length < 3) {
      nudges.push({
        type: 'suggestion',
        title: 'Work Context Available',
        message: `You have ${workEntries.length} work-related items. Consider grouping related tasks.`,
        severity: 'low',
        action: 'organize',
        icon: Tag,
        color: 'text-green-500'
      });
    }

    setSmartNudges(nudges);
  };

  // Check for overdue items
  const checkOverdueItems = () => {
    const now = new Date();
    const overdue = entries.filter(entry => {
      if (!entry.dueDate || !entry.isDeadline || entry.status === 'completed') return false;
      return entry.dueDate < now;
    });

    const overdueReminders = overdue.map(entry => ({
      type: 'overdue',
      title: 'Overdue Task',
      message: `"${entry.content}" was due ${Math.floor((now.getTime() - (entry.dueDate as Date).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
      entryId: entry.id,
      severity: 'urgent',
      action: 'complete',
      icon: AlertCircle,
      color: 'text-red-500'
    }));

    setOverdueReminders(overdueReminders);
  };

  // Smart filtering and organization
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.some(tag => entry.tags.includes(tag))
      );
    }

    // Apply type filter - only if not 'all'
    if (activeFilters.type && activeFilters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === activeFilters.type);
    }

    // Apply priority filter - only if not 'all'
    if (activeFilters.priority && activeFilters.priority !== 'all') {
      filtered = filtered.filter(entry => entry.priority === activeFilters.priority);
    }

    // Apply status filter - only if not 'all'
    if (activeFilters.status && activeFilters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === activeFilters.status);
    }

    return filtered;
  }, [entries, searchQuery, selectedTags, activeFilters]);

  // Smart categorization
  const categorizedEntries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const categorized = {
      urgent: filteredEntries.filter(entry => 
        entry.priority === 'urgent' && entry.status !== 'completed'
      ),
      today: filteredEntries.filter(entry => {
        if (entry.status === 'completed') return false;
        // Don't include journal entries in today's focus
        if (entry.type === 'journal') return false;
        // Include entries pinned for today
        if (entry.pinnedForDate) {
          return entry.pinnedForDate.toDateString() === today.toDateString();
        }
        // Include entries due today
        if (entry.dueDate && entry.isDeadline) {
          return entry.dueDate.toDateString() === today.toDateString();
        }
        // Include entries created today (new entries should appear here)
        if (entry.createdAt) {
          return entry.createdAt.toDateString() === today.toDateString();
        }
        return false;
      }),
      thisWeek: filteredEntries.filter(entry => {
        if (entry.status === 'completed') return false;
        // Include entries due this week (but not today)
        if (entry.dueDate && entry.isDeadline) {
          const dueDate = entry.dueDate;
          return dueDate > today && dueDate <= endOfWeek;
        }
        // Include entries pinned for this week (but not today)
        if (entry.pinnedForDate) {
          const pinnedDate = entry.pinnedForDate;
          return pinnedDate > today && pinnedDate <= endOfWeek;
        }
        // Include entries created this week (but not today)
        if (entry.createdAt) {
          const createdDate = entry.createdAt;
          return createdDate > today && createdDate <= endOfWeek;
        }
        return false;
      }),
      ideas: filteredEntries.filter(entry => 
        entry.type === 'idea' && entry.status !== 'completed'
      ),
      journal: filteredEntries.filter(entry => 
        entry.type === 'journal' && entry.status !== 'completed'
      ),
      later: filteredEntries.filter(entry => {
        if (entry.status === 'completed') return false;
        
        // If entry is already categorized in other sections, don't include it here
        const isInUrgent = entry.priority === 'urgent';
        const isInToday = (() => {
          if (entry.pinnedForDate) {
            return entry.pinnedForDate.toDateString() === today.toDateString();
          }
          if (entry.dueDate && entry.isDeadline) {
            return entry.dueDate.toDateString() === today.toDateString();
          }
          if (entry.createdAt) {
            return entry.createdAt.toDateString() === today.toDateString();
          }
          return false;
        })();
        const isInThisWeek = (() => {
          if (entry.dueDate && entry.isDeadline) {
            return entry.dueDate >= today && entry.dueDate <= endOfWeek;
          }
          if (entry.pinnedForDate) {
            return entry.pinnedForDate >= today && entry.pinnedForDate <= endOfWeek;
          }
          if (entry.createdAt) {
            return entry.createdAt >= today && entry.createdAt <= endOfWeek;
          }
          return false;
        })();
        const isInIdeas = entry.type === 'idea';
        const isInJournal = entry.type === 'journal';
        
        // Include if not in any other section
        return !isInUrgent && !isInToday && !isInThisWeek && !isInIdeas && !isInJournal;
      }),
      done: filteredEntries.filter(entry => entry.status === 'completed')
    };

    // Filter out today entries from thisWeek to avoid duplication
    categorized.thisWeek = categorized.thisWeek.filter(entry => 
      !categorized.today.some(todayEntry => todayEntry.id === entry.id)
    );

    // Filter out thisWeek entries from later to avoid duplication
    categorized.later = categorized.later.filter(entry => 
      !categorized.today.some(todayEntry => todayEntry.id === entry.id) &&
      !categorized.thisWeek.some(weekEntry => weekEntry.id === entry.id)
    );

    return categorized;
  }, [filteredEntries]);



  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [entries]);

  // Smart sorting
  const sortEntries = (entries: Entry[]) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return [...entries].sort((a, b) => 
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      case 'date':
        return [...entries].sort((a, b) => {
          const aDate = a.dueDate || a.pinnedForDate || a.createdAt;
          const bDate = b.dueDate || b.pinnedForDate || b.createdAt;
          return aDate.getTime() - bDate.getTime();
        });
      case 'type':
        return [...entries].sort((a, b) => a.type.localeCompare(b.type));
      case 'created':
        return [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      default:
        return entries;
    }
  };

  // Entry actions
  const togglePin = (entry: Entry) => {
    const newPinnedForDate = entry.pinnedForDate ? undefined : new Date();
    updateEntry(entry.id, { pinnedForDate: newPinnedForDate });
  };

  const toggleComplete = (entry: Entry) => {
    const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date() : undefined;
    updateEntry(entry.id, { 
      status: newStatus, 
      completedAt 
    });
  };

  const moveEntry = (entry: Entry, targetSection: string) => {
    let updates: Partial<Entry> = {};
    
    switch (targetSection) {
      case 'today':
        updates.pinnedForDate = new Date();
        updates.dueDate = undefined;
        updates.isDeadline = false;
        break;
      case 'thisWeek':
        const thisWeekDate = new Date();
        thisWeekDate.setDate(thisWeekDate.getDate() + 3); // Set to 3 days from now (middle of week)
        thisWeekDate.setHours(12, 0, 0, 0); // Set to noon
        updates.dueDate = thisWeekDate;
        updates.pinnedForDate = undefined;
        updates.isDeadline = true;
        break;
      case 'later':
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updates.dueDate = nextMonth;
        updates.pinnedForDate = undefined;
        updates.isDeadline = true;
        break;
    }
    
    updateEntry(entry.id, updates);
  };

  const deleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      storeDeleteEntry(entryId);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Smart Header with Insights */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('capture')}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Thought
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Smart Insights Bar */}
        {showInsights && (smartNudges.length > 0 || overdueReminders.length > 0 || patternInsights.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Smart Insights
              </h2>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Overdue Reminders */}
              {overdueReminders.slice(0, 3).map((reminder, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <reminder.icon className={`w-5 h-5 ${reminder.color} mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800">{reminder.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{reminder.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Smart Nudges */}
              {smartNudges.slice(0, 3).map((nudge, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <nudge.icon className={`w-5 h-5 ${nudge.color} mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-800">{nudge.title}</h4>
                      <p className="text-sm text-blue-700 mt-1">{nudge.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pattern Insights */}
              {patternInsights.slice(0, 3).map((insight, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <insight.icon className={`w-5 h-5 ${insight.color} mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-purple-800">{insight.title}</h4>
                      <p className="text-sm text-purple-700 mt-1">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search thoughts, tags, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters({ ...activeFilters, type: e.target.value as EntryType | 'all' })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="idea">Ideas</option>
                <option value="insight">Insights</option>
                <option value="reflection">Reflections</option>
                <option value="event">Events</option>
                <option value="note">Notes</option>
              </select>
              
              <select
                value={activeFilters.priority}
                onChange={(e) => setActiveFilters({ ...activeFilters, priority: e.target.value as Priority | 'all' })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="type">Sort by Type</option>
                <option value="created">Sort by Created</option>
              </select>
            </div>
          </div>
          
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Smart Sections */}
        <div className="space-y-8">
          



          {/* Urgent Section */}
          {categorizedEntries.urgent.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Urgent & Important</h3>
                    <p className="text-sm text-gray-500">{categorizedEntries.urgent.length} items need immediate attention</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, urgent: !expandedSections.urgent })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expandedSections.urgent ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
              
              {expandedSections.urgent && (
                <div className="p-6">
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.urgent).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Today Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Focus</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.today.length} items for today</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, today: !expandedSections.today })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.today ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.today && (
              <div className="p-6">
                {categorizedEntries.today.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.today).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No focus items for today</p>
                    <p className="text-sm">Add some thoughts or tasks to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* This Week Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.thisWeek.length} items due this week</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, thisWeek: !expandedSections.thisWeek })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.thisWeek ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.thisWeek && (
              <div className="p-6">
                {categorizedEntries.thisWeek.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.thisWeek).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No items for this week</p>
                    <p className="text-sm">Plan ahead by setting some deadlines</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ideas Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ideas & Insights</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.ideas.length} creative thoughts</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, ideas: !expandedSections.ideas })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.ideas ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.ideas && (
              <div className="p-6">
                {categorizedEntries.ideas.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.ideas).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No ideas captured yet</p>
                    <p className="text-sm">Start capturing your creative thoughts and insights</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Journal Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Journal & Reflections</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.journal.length} personal entries</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, journal: !expandedSections.journal })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.journal ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.journal && (
              <div className="p-6">
                {categorizedEntries.journal.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.journal).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No journal entries yet</p>
                    <p className="text-sm">Capture your thoughts, feelings, and reflections</p>
                    </div>
                )}
              </div>
            )}
          </div>

          {/* Later Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Later</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.later.length} items for later</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, later: !expandedSections.later })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.later ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.later && (
              <div className="p-6">
                {categorizedEntries.later.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.later).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No items for later</p>
                    <p className="text-sm">All your thoughts are organized for now</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Done Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Done</h3>
                  <p className="text-sm text-gray-500">{categorizedEntries.done.length} completed items</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedSections({ ...expandedSections, done: !expandedSections.done })}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.done ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedSections.done && (
              <div className="p-6">
                {categorizedEntries.done.length > 0 ? (
                  <div className="space-y-3">
                    {sortEntries(categorizedEntries.done).map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onTogglePin={() => togglePin(entry)}
                        onToggleComplete={() => toggleComplete(entry)}
                        onMove={(target) => moveEntry(entry, target)}
                        onDelete={() => deleteEntry(entry.id)}
                        showActions={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No completed items yet</p>
                    <p className="text-sm">Start checking off your tasks to see progress</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Entry Card Component
interface EntryCardProps {
  entry: Entry;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onMove: (target: string) => void;
  onDelete: () => void;
  showActions: boolean;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onTogglePin,
  onToggleComplete,
  onMove,
  onDelete,
  showActions
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'insight': return <Brain className="w-4 h-4" />;
      case 'reflection': return <TrendingUp className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'note': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: EntryType) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'idea': return 'bg-purple-100 text-purple-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'reflection': return 'bg-indigo-100 text-indigo-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      entry.status === 'completed' ? 'opacity-75 bg-gray-50' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={entry.status === 'completed'}
          onChange={onToggleComplete}
          className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium text-gray-900 leading-relaxed ${
                entry.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}>
                {entry.content}
              </h4>
              
              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getTypeColor(entry.type)}`}>
                  {getTypeIcon(entry.type)}
                  <span className="ml-1 capitalize">{entry.type}</span>
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getPriorityColor(entry.priority)}`}>
                  {entry.priority}
                </span>
                
                {entry.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.dueDate.toLocaleDateString()}
                  </span>
                )}
                
                {entry.pinnedForDate && !entry.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Pinned: {entry.pinnedForDate.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {/* Pin Button */}
                <button
                  onClick={onTogglePin}
                  className={`p-1.5 rounded-md transition-colors ${
                    entry.pinnedForDate
                      ? 'text-yellow-600 hover:bg-yellow-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title={entry.pinnedForDate ? 'Unpin' : 'Pin to today'}
                >
                  <Star className={`w-4 h-4 ${entry.pinnedForDate ? 'fill-current' : ''}`} />
                </button>
                
                {/* Move Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Move to"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  
                  {showMoveMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onMove('today');
                            setShowMoveMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Move to Today
                        </button>
                        <button
                          onClick={() => {
                            onMove('thisWeek');
                            setShowMoveMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Move to This Week
                        </button>
                        <button
                          onClick={() => {
                            onMove('later');
                            setShowMoveMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Move to Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Edit Button */}
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={onDelete}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};