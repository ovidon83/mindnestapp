import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { Share2, Linkedin, Instagram, Loader2, ExternalLink, CheckCircle2, BarChart3, RefreshCw, Copy, X, ArrowLeft, Brain } from 'lucide-react';
import Navigation from './Navigation';
import { PlatformPreview } from './PlatformPreviews';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';

type Platform = 'linkedin' | 'twitter' | 'instagram';

const ShareItView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    generateSharePosts,
    generatePostImage,
    markAsShared,
    loadThoughts,
    addSpark,
    removeSpark,
    navigateToThoughtId,
    clearNavigateToThought,
    updateThought,
  } = useGenieNotesStore();

  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('linkedin');
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [retryModal, setRetryModal] = useState<{ thoughtId: string } | null>(null);
  const [retrySuggestion, setRetrySuggestion] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'potential'>('potential');
  const [showShareToast, setShowShareToast] = useState<{ platform: Platform; visible: boolean } | null>(null);
  const [filterShared, setFilterShared] = useState<'all' | 'draft' | 'shared'>('all');
  const [generatingImage, setGeneratingImage] = useState<Record<string, boolean>>({});

  // Get user info for preview
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Your Name';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // All thoughts with Share potential (unfiltered - for analytics)
  const allShareThoughts = useMemo(() => {
    return thoughts.filter(thought => {
      const potential = thought.potential || thought.bestPotential;
      return potential === 'Share';
    });
  }, [thoughts]);

  // Filter and sort thoughts that have Share potential
  const shareThoughts = useMemo(() => {
    let filtered = allShareThoughts;
    
    // Apply filter
    if (filterShared === 'shared') {
      filtered = filtered.filter(thought => {
        return thought.sharePosts?.shared?.linkedin || 
               thought.sharePosts?.shared?.twitter || 
               thought.sharePosts?.shared?.instagram;
      });
    } else if (filterShared === 'draft') {
      filtered = filtered.filter(thought => {
        return !!thought.sharePosts && 
               (!thought.sharePosts.shared?.linkedin && 
                !thought.sharePosts.shared?.twitter && 
                !thought.sharePosts.shared?.instagram);
      });
    }

    // Sort based on selected order
    if (sortOrder === 'potential') {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = calculatePowerfulScore(a, thoughts) || 0;
        const scoreB = calculatePowerfulScore(b, thoughts) || 0;
        
        if (Math.abs(scoreA - scoreB) > 10) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      filtered = [...filtered].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return filtered;
  }, [allShareThoughts, sortOrder, filterShared, thoughts]);

  const selectedThought = useMemo(() => {
    // First try to find in filtered shareThoughts
    const inFiltered = shareThoughts.find(t => t.id === selectedThoughtId);
    if (inFiltered) return inFiltered;
    
    // If not in filtered list, check allShareThoughts (thought might be filtered out)
    if (selectedThoughtId) {
      const inAll = allShareThoughts.find(t => t.id === selectedThoughtId);
      if (inAll) return inAll;
    }
    
    // Fallback to first thought in filtered list
    return shareThoughts[0] || null;
  }, [shareThoughts, allShareThoughts, selectedThoughtId]);

  // Analytics - always use allShareThoughts (unfiltered)
  const analytics = useMemo(() => {
    const totalThoughts = allShareThoughts.length;
    const withDrafts = allShareThoughts.filter(t => t.sharePosts).length;
    const sharedCounts = {
      linkedin: allShareThoughts.filter(t => t.sharePosts?.shared?.linkedin).length,
      twitter: allShareThoughts.filter(t => t.sharePosts?.shared?.twitter).length,
      instagram: allShareThoughts.filter(t => t.sharePosts?.shared?.instagram).length,
    };
    const totalShared = Object.values(sharedCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      totalThoughts,
      withDrafts,
      sharedCounts,
      totalShared,
    };
  }, [allShareThoughts]);

  // Helper to count words
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleGeneratePosts = async (thoughtId: string) => {
    if (generating[thoughtId]) return;
    
    setGenerating(prev => ({ ...prev, [thoughtId]: true }));
    try {
      await generateSharePosts(thoughtId);
      if (!selectedThoughtId) {
        setSelectedThoughtId(thoughtId);
      }
    } catch (error) {
      console.error('Error generating posts:', error);
    } finally {
      setGenerating(prev => ({ ...prev, [thoughtId]: false }));
    }
  };

  const handleCopyPost = async (text: string, thoughtId: string, platform: Platform) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPost(`${thoughtId}-${platform}`);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSharePost = async (platform: Platform, content: string, thoughtId: string) => {
    switch (platform) {
      case 'linkedin':
        await handleCopyPost(content, thoughtId, platform);
        setShowShareToast({ platform: 'linkedin', visible: true });
        setTimeout(() => setShowShareToast(null), 5000);
        window.open('https://www.linkedin.com/feed/', '_blank', 'noopener,noreferrer');
        break;
      case 'twitter':
        const encodedContent = encodeURIComponent(content);
        const url = `https://twitter.com/intent/tweet?text=${encodedContent}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        markAsShared(thoughtId, platform);
        break;
      case 'instagram':
        await handleCopyPost(content, thoughtId, platform);
        setShowShareToast({ platform: 'instagram', visible: true });
        setTimeout(() => setShowShareToast(null), 5000);
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        break;
      default:
        return;
    }
  };

  const handleMarkAsShared = async (thoughtId: string, platform: Platform) => {
    try {
      const thought = thoughts.find(t => t.id === thoughtId);
      if (!thought || !thought.sharePosts) return;
      
      // Toggle: if already shared, unshare it; otherwise, mark as shared
      const isCurrentlyShared = thought.sharePosts.shared?.[platform];
      
      if (isCurrentlyShared) {
        // Unshare: remove the shared flag for this platform
        const updatedSharePosts = {
          ...thought.sharePosts,
          shared: {
            ...(thought.sharePosts.shared || {}),
            [platform]: false,
          },
        };
        await updateThought(thoughtId, { sharePosts: updatedSharePosts });
      } else {
        // Mark as shared
        await markAsShared(thoughtId, platform);
      }
    } catch (error) {
      console.error('Error toggling shared status:', error);
      await loadThoughts();
    }
  };

  const handleRetryDraft = async () => {
    if (!retryModal) return;
    const { thoughtId } = retryModal;
    if (generating[thoughtId]) return;
    
    setGenerating(prev => ({ ...prev, [thoughtId]: true }));
    
    try {
      const thought = thoughts.find(t => t.id === thoughtId);
      if (!thought) return;
      
      await generateSharePosts(thoughtId, thought, retrySuggestion.trim() || undefined);
      await loadThoughts();
    } catch (error) {
      console.error('Error retrying draft:', error);
    } finally {
      setGenerating(prev => ({ ...prev, [thoughtId]: false }));
      setRetryModal(null);
      setRetrySuggestion('');
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedThought) return;
    const key = selectedThought.id;
    if (generatingImage[key]) return;

    setGeneratingImage(prev => ({ ...prev, [key]: true }));
    
    try {
      await generatePostImage(selectedThought.id);
      await loadThoughts();
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingImage(prev => ({ ...prev, [key]: false }));
    }
  };

  // Auto-select thought when navigating from Thoughts view, or first thought if none selected
  React.useEffect(() => {
    if (navigateToThoughtId) {
      // Check if the thought exists in allShareThoughts (unfiltered) - this ensures we can select it
      // even if it's filtered out of shareThoughts by the current filter settings
      const thoughtExists = allShareThoughts.some(t => t.id === navigateToThoughtId);
      if (thoughtExists) {
        setSelectedThoughtId(navigateToThoughtId);
        clearNavigateToThought();
        // Also ensure the filter is set to 'all' so the thought is visible in the list
        if (filterShared !== 'all') {
          setFilterShared('all');
        }
      }
      // If thought doesn't exist yet (still loading), wait for it
    } else if (!selectedThoughtId && shareThoughts.length > 0) {
      // No navigation target, select first thought
      setSelectedThoughtId(shareThoughts[0].id);
    }
  }, [allShareThoughts, shareThoughts, selectedThoughtId, navigateToThoughtId, clearNavigateToThought, filterShared]);

  // Handle navigation from Thoughts view
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const thoughtId = urlParams.get('thoughtId');
    if (thoughtId && shareThoughts.some(t => t.id === thoughtId)) {
      setSelectedThoughtId(thoughtId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [shareThoughts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading thoughts...</p>
        </div>
      </div>
    );
  }

  const currentPostContent = selectedThought?.sharePosts?.[activePlatform];
  const wordCount = currentPostContent ? countWords(currentPostContent) : 0;
  const isShared = selectedThought?.sharePosts?.shared?.[activePlatform];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-rose-50/20 to-white">
      <Navigation
        currentView="shareit"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shareThoughts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <Share2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No thoughts to share yet</h3>
            <p className="text-slate-500 mb-4">Mark thoughts as "Share" in the Thoughts view to see them here.</p>
            <button
              onClick={() => setCurrentView('thoughts')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Thoughts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analytics - Individual Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{analytics.totalThoughts}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Total</div>
              </div>
              
              {/* Drafts */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1">{analytics.withDrafts}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Drafts</div>
              </div>
              
              {/* Shared */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{analytics.totalShared}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Shared</div>
              </div>
              
              {/* LinkedIn */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50 flex flex-col items-center justify-center gap-2">
                <Linkedin className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.sharedCounts.linkedin}</div>
              </div>
              
              {/* X (Twitter) */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50 flex flex-col items-center justify-center gap-2">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.sharedCounts.twitter}</div>
              </div>
              
              {/* Instagram */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200/50 flex flex-col items-center justify-center gap-2">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.sharedCounts.instagram}</div>
              </div>
            </div>

            {/* Main Content: Left Sidebar + Right Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Share Queue */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)', minHeight: '500px' }}>
                <div className="p-3 sm:p-4 flex-shrink-0">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 sm:mb-4">Share Queue</h2>
                  
                  {/* Filter: All | Draft | Shared */}
                  <div className="flex items-center gap-1 mb-3">
                    <button
                      onClick={() => setFilterShared('all')}
                      className={`flex-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterShared === 'all'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterShared('draft')}
                      className={`flex-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterShared === 'draft'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => setFilterShared('shared')}
                      className={`flex-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterShared === 'shared'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Shared
                    </button>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'potential')}
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-slate-400 transition-colors"
                  >
                    <option value="potential">Potential</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="space-y-2">
                    {shareThoughts.map((thought) => {
                      const isSelected = thought.id === selectedThoughtId;
                      const hasPosts = !!thought.sharePosts;
                      const isGen = generating[thought.id];
                      const isSharedThought = thought.sharePosts?.shared?.linkedin || 
                                              thought.sharePosts?.shared?.twitter || 
                                              thought.sharePosts?.shared?.instagram;

                      return (
                        <div
                          key={thought.id}
                          onClick={() => setSelectedThoughtId(thought.id)}
                          className={`w-full p-2.5 sm:p-3 transition-colors cursor-pointer rounded-lg ${
                            isSelected
                              ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-1.5 mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (thought.isSpark) {
                                  removeSpark(thought.id);
                                } else {
                                  addSpark(thought.id);
                                }
                              }}
                              className="text-amber-500 text-xs mt-0.5 flex-shrink-0 hover:text-amber-600 transition-colors"
                              title={thought.isSpark ? "Remove spark" : "Add spark"}
                            >
                              {thought.isSpark ? '✨' : '☆'}
                            </button>
                            <p className={`text-xs leading-snug line-clamp-3 flex-1 ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-800'}`}>
                              {thought.originalText}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasPosts && !isSharedThought && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">
                                Draft
                              </span>
                            )}
                            {isSharedThought && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">
                                Shared
                              </span>
                            )}
                            {isGen && (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)', minHeight: '500px' }}>
                {selectedThought ? (
                  <>
                    {!selectedThought.sharePosts ? (
                      /* Generate Posts CTA */
                      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                          <Share2 className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Generate post drafts</h3>
                        <p className="text-slate-600 mb-6 max-w-md">Create optimized posts for LinkedIn, X, and Instagram from your thought.</p>
                        <button
                          onClick={() => handleGeneratePosts(selectedThought.id)}
                          disabled={generating[selectedThought.id]}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {generating[selectedThought.id] ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Share2 className="w-5 h-5" />
                              Generate Posts
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Original Thought - Above Tabs */}
                        {selectedThought.originalText && (
                          <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-purple-50/20 border-b border-orange-100/50 flex-shrink-0">
                            <div className="max-w-4xl mx-auto">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide">Original Thought</div>
                                <button
                                  onClick={() => {
                                    setCurrentView('thoughts');
                                    // Try to navigate to the specific thought if possible
                                    setTimeout(() => {
                                      const thoughtElement = document.querySelector(`[data-thought-id="${selectedThought.id}"]`);
                                      if (thoughtElement) {
                                        thoughtElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        thoughtElement.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2');
                                        setTimeout(() => {
                                          thoughtElement.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2');
                                        }, 2000);
                                      }
                                    }, 100);
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="View this thought in Thoughts view"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <Brain className="w-3 h-3" />
                                  <span className="hidden sm:inline">Back to Thoughts</span>
                                </button>
                              </div>
                              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                                {selectedThought.originalText}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Platform Tabs - Icons Only */}
                        <div className="flex-shrink-0 bg-white border-b border-slate-200">
                          <div className="flex items-center gap-1.5 p-2">
                            <button
                              onClick={() => setActivePlatform('linkedin')}
                              className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-150 flex items-center justify-center ${
                                activePlatform === 'linkedin'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                              }`}
                            >
                              <Linkedin className="w-4 h-4" />
                              {selectedThought.sharePosts?.shared?.linkedin && (
                                <CheckCircle2 className="w-3 h-3 ml-1.5 text-blue-600" />
                              )}
                            </button>
                            <button
                              onClick={() => setActivePlatform('twitter')}
                              className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-150 flex items-center justify-center ${
                                activePlatform === 'twitter'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                              }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                              {selectedThought.sharePosts?.shared?.twitter && (
                                <CheckCircle2 className="w-3 h-3 ml-1.5 text-slate-600" />
                              )}
                            </button>
                            <button
                              onClick={() => setActivePlatform('instagram')}
                              className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-150 flex items-center justify-center ${
                                activePlatform === 'instagram'
                                  ? 'bg-pink-50 text-pink-600 border border-pink-200'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                              }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              {selectedThought.sharePosts?.shared?.instagram && (
                                <CheckCircle2 className="w-3 h-3 ml-1.5 text-pink-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Preview Content - Narrower */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/30">
                          {currentPostContent ? (
                            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                              <PlatformPreview
                                platform={activePlatform}
                                content={currentPostContent}
                                imageUrl={
                                  (activePlatform === 'linkedin' || activePlatform === 'instagram')
                                    ? selectedThought.sharePosts?.imageUrl
                                    : undefined
                                }
                                onCopy={() => handleCopyPost(currentPostContent, selectedThought.id, activePlatform)}
                                copied={copiedPost === `${selectedThought.id}-${activePlatform}`}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-20 text-slate-500">
                              No draft available for this platform
                            </div>
                          )}
                        </div>

                        {/* Bottom Action Bar - Sticky */}
                        {currentPostContent && (
                          <div className="bg-white p-3 sm:p-4 flex-shrink-0 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500">{wordCount} words</span>
                                {/* Image Generation Button - Only for LinkedIn and Instagram */}
                                {(activePlatform === 'linkedin' || activePlatform === 'instagram') && (
                                  <button
                                    onClick={handleGenerateImage}
                                    disabled={generatingImage[selectedThought.id]}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                      selectedThought.sharePosts?.imageUrl
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={
                                      selectedThought.sharePosts?.imageUrl
                                        ? 'Image generated - click to regenerate'
                                        : 'Generate AI image for LinkedIn and Instagram posts'
                                    }
                                  >
                                    {generatingImage[selectedThought.id] ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Generating...</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>
                                          {selectedThought.sharePosts?.imageUrl ? 'Image' : 'Add Image'}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setRetryModal({ thoughtId: selectedThought.id })}
                                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span className="hidden sm:inline">Retry Draft</span>
                                </button>
                                <button
                                  onClick={() => handleCopyPost(currentPostContent, selectedThought.id, activePlatform)}
                                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                                    copiedPost === `${selectedThought.id}-${activePlatform}`
                                      ? 'bg-green-50 text-green-700'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <Copy className="w-4 h-4" />
                                  <span className="hidden sm:inline">{copiedPost === `${selectedThought.id}-${activePlatform}` ? 'Copied!' : 'Copy'}</span>
                                </button>
                                <button
                                  onClick={() => handleSharePost(activePlatform, currentPostContent, selectedThought.id)}
                                  className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="hidden sm:inline">Share</span>
                                </button>
                                <button
                                  onClick={() => handleMarkAsShared(selectedThought.id, activePlatform)}
                                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                                    isShared
                                      ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                  }`}
                                  title={isShared ? "Mark as Draft (Unshare)" : "Mark as Shared"}
                                >
                                  <CheckCircle2 className={`w-4 h-4 ${isShared ? 'text-slate-500' : ''}`} />
                                  <span className="hidden sm:inline">{isShared ? 'Mark as Draft' : 'Mark as Shared'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 py-20">
                    Select a thought to view preview
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Toast Notification */}
      {showShareToast && showShareToast.visible && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-xl p-4 z-[9999] max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {showShareToast.platform === 'linkedin' ? (
                <Linkedin className="w-5 h-5 text-blue-600" />
              ) : showShareToast.platform === 'twitter' ? (
                <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              ) : (
                <Instagram className="w-5 h-5 text-pink-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900 text-sm mb-1">
                Content copied to clipboard! ✓
              </div>
              <div className="text-xs text-slate-600 mb-3">
                {showShareToast.platform === 'linkedin' 
                  ? 'Click "Start a post" on LinkedIn and paste the content.'
                  : 'Paste it as the caption when you create a new post on Instagram.'}
              </div>
              {selectedThought && !selectedThought.sharePosts?.shared?.[showShareToast.platform] && (
                <button
                  onClick={() => {
                    setShowShareToast(null);
                    markAsShared(selectedThought.id, showShareToast.platform);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark as shared →
                </button>
              )}
            </div>
            <button
              onClick={() => setShowShareToast(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Retry Modal */}
      {retryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Regenerate All Drafts</h3>
              <button
                onClick={() => {
                  setRetryModal(null);
                  setRetrySuggestion('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Provide feedback to improve all drafts (LinkedIn, X, Instagram) - optional:
            </p>
            <textarea
              value={retrySuggestion}
              onChange={(e) => setRetrySuggestion(e.target.value)}
              placeholder="e.g., Make it more casual, Add more examples, Focus on the technical aspect..."
              className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={4}
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleRetryDraft}
                disabled={generating[retryModal.thoughtId]}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating[retryModal.thoughtId] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate All
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRetryModal(null);
                  setRetrySuggestion('');
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareItView;
