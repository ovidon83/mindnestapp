import React, { useState } from 'react';
import { Sparkles, CheckSquare, Lightbulb, FileText, BookOpen, Heart } from 'lucide-react';
import { useMindnestStore } from '../store';
import { AIService } from '../services/ai';

interface RandomThoughtInputProps {
  onCategoryRoute?: (category: string) => void;
}

export const RandomThoughtInput: React.FC<RandomThoughtInputProps> = ({ onCategoryRoute }) => {
  const [thought, setThought] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addRandomThought, addTodo, addNote, addIdea, addProject, addJournalEntry, createMultipleItems } = useMindnestStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (thought.trim()) {
      addRandomThought({
        content: thought.trim(),
      });
      setThought('');
    }
  };

  const handleAnalyzeMultipleTopics = async () => {
    if (!thought.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await AIService.analyzeMultipleTopics(thought.trim());
      createMultipleItems(result);
      setThought('');
      
      // Show success message
      const totalItems = result.tasks.length + result.notes.length + result.ideas.length + result.projects.length + result.journalEntries.length;
      if (totalItems > 0) {
        alert(`Created ${totalItems} items from your thought!`);
      }
    } catch (error) {
      console.error('Error analyzing thought:', error);
      alert('Failed to analyze thought. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDirectCreate = (type: 'task' | 'note' | 'idea' | 'project' | 'journal') => {
    if (!thought.trim()) return;
    
    const content = thought.trim();
    setThought('');
    
    switch (type) {
      case 'task':
        addTodo({
          content,
          completed: false,
          priority: 'medium',
          tags: ['from-thought'],
        });
        break;
      case 'note':
        addNote({
          title: content.split('\n')[0].substring(0, 50) + (content.length > 50 ? '...' : ''),
          content,
          tags: ['from-thought'],
        });
        break;
      case 'idea':
        addIdea({
          title: content.split('\n')[0].substring(0, 50) + (content.length > 50 ? '...' : ''),
          description: content,
          category: 'other',
          status: 'concept',
          potential: 'medium',
          tags: ['from-thought'],
        });
        break;
      case 'project':
        addProject({
          name: content.split('\n')[0].substring(0, 50) + (content.length > 50 ? '...' : ''),
          description: content,
          status: 'idea',
          tags: ['from-thought'],
        });
        break;
      case 'journal':
        addJournalEntry({
          content,
          mood: 'okay',
        });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Sparkles size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-2">
            Capture Your Thoughts
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
            Write freely. Let AI organize it, or create items directly.
          </p>
        </div>

        {/* Main Input */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="relative">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="What's on your mind? Write anything that comes to you..."
              className="w-full h-48 sm:h-64 md:h-80 p-4 sm:p-6 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:bg-white placeholder-gray-500 text-base sm:text-lg leading-relaxed resize-none transition-all duration-200"
              autoFocus
            />
            
            {/* Character count - mobile friendly */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 text-xs sm:text-sm text-gray-400">
              {thought.length} characters
            </div>
          </div>

          {/* Smart Single Button with Contextual Options */}
          <div className="flex justify-center">
            <div className="relative group">
              {/* Main AI Button */}
              <button
                type="button"
                onClick={handleAnalyzeMultipleTopics}
                disabled={!thought.trim() || isAnalyzing}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base font-medium min-h-[56px] touch-manipulation relative overflow-hidden"
              >
                <Sparkles size={20} className="animate-pulse" />
                <span className="relative z-10">
                  {isAnalyzing ? 'Working magic...' : 'Organize my thoughts'}
                </span>
                
                {/* Subtle indicator for more options */}
                {!isAnalyzing && thought.trim() && (
                  <div className="hidden sm:block w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                )}
                
                {/* Subtle hint for more options */}
                {!isAnalyzing && thought.trim() && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>

              {/* Contextual Quick Actions - Appear on Hover/Touch */}
              {!isAnalyzing && thought.trim() && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 min-w-[280px] sm:min-w-[320px]">
                    <div className="text-xs text-gray-500 text-center mb-2 px-3 py-1">
                      Or save directly as:
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDirectCreate('task')}
                        className="flex items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left group/item"
                      >
                        <CheckSquare size={16} className="text-blue-600 group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Task</span>
                      </button>
                      
                      <button
                        onClick={() => handleDirectCreate('note')}
                        className="flex items-center gap-2 p-3 rounded-xl hover:bg-green-50 transition-colors text-left group/item"
                      >
                        <FileText size={16} className="text-green-600 group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Note</span>
                      </button>
                      
                      <button
                        onClick={() => handleDirectCreate('idea')}
                        className="flex items-center gap-2 p-3 rounded-xl hover:bg-yellow-50 transition-colors text-left group/item"
                      >
                        <Lightbulb size={16} className="text-yellow-600 group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Idea</span>
                      </button>
                      
                      <button
                        onClick={() => handleDirectCreate('journal')}
                        className="flex items-center gap-2 p-3 rounded-xl hover:bg-purple-50 transition-colors text-left group/item"
                      >
                        <Heart size={16} className="text-purple-600 group-hover/item:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Memory</span>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleSubmit}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors text-xs text-gray-600"
                      >
                        <BookOpen size={14} />
                        Just keep as thought
                      </button>
                    </div>
                  </div>
                  
                  {/* Arrow pointing up to main button */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white mb-[-1px]" />
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile help text */}
          {!isAnalyzing && thought.trim() && (
            <div className="text-center sm:hidden">
              <p className="text-xs text-gray-500 mt-4">
                Hover or long-press the button for more options
              </p>
            </div>
          )}
        </form>

        {/* Helpful Tips - Mobile responsive */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Let AI help</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Not sure what to do with your thought? Let AI figure it out and organize everything for you.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">You decide</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Know exactly what this is? Skip the AI and create it directly as a task, note, or idea.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl sm:col-span-2 lg:col-span-1">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Keep it simple</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Sometimes you just want to save a thought. No organizing, no categories—just capture it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 