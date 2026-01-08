import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { 
  Sparkles, 
  Linkedin, 
  Send, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  X, 
  ArrowLeft,
  ExternalLink,
  Edit3,
  Save,
  Image,
  ChevronDown,
  Filter,
  TrendingUp
} from 'lucide-react';
import NavigationNew from './NavigationNew';
import { PlatformPreview } from './PlatformPreviews';
import { calculatePowerfulScore } from '../lib/calculate-powerful-score';

type Platform = 'linkedin' | 'twitter' | 'instagram';
type QueueFilter = 'all' | 'draft' | 'shared';
type QueueSort = 'newest' | 'potential';

const ShareStudioView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    generateSharePosts,
    generatePostImage,
    markAsShared,
    updateThought,
    navigateToThoughtId,
    clearNavigateToThought,
  } = useGenieNotesStore();

  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('linkedin');
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [retryFeedback, setRetryFeedback] = useState('');
  const [showRetryInput, setShowRetryInput] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [queueSort, setQueueSort] = useState<QueueSort>('potential');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const thoughtListRef = useRef<HTMLDivElement>(null);
  const selectedThoughtRef = useRef<HTMLButtonElement>(null);

  // Get thoughts with Share potential
  const shareThoughts = useMemo(() => {
    let filtered = thoughts.filter(t => t.potential === 'Share' && !t.isParked);
    
    // Apply filter
    if (queueFilter === 'draft') {
      filtered = filtered.filter(t => t.sharePosts && !t.sharePosts.shared?.linkedin && !t.sharePosts.shared?.twitter && !t.sharePosts.shared?.instagram);
    } else if (queueFilter === 'shared') {
      filtered = filtered.filter(t => t.sharePosts?.shared?.linkedin || t.sharePosts?.shared?.twitter || t.sharePosts?.shared?.instagram);
    }
    
    // Apply sort
    if (queueSort === 'potential') {
      filtered.sort((a, b) => {
        const scoreA = calculatePowerfulScore(a, thoughts) || 0;
        const scoreB = calculatePowerfulScore(b, thoughts) || 0;
        if (Math.abs(scoreA - scoreB) > 10) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filtered;
  }, [thoughts, queueFilter, queueSort]);

  const selectedThought = useMemo(() => {
    return shareThoughts.find(t => t.id === selectedThoughtId) || shareThoughts[0] || null;
  }, [shareThoughts, selectedThoughtId]);

  // Auto-select navigated thought or first thought
  useEffect(() => {
    if (navigateToThoughtId) {
      // Find in all share thoughts (not just filtered)
      const allShareThoughts = thoughts.filter(t => t.potential === 'Share' && !t.isParked);
      const thought = allShareThoughts.find(t => t.id === navigateToThoughtId);
      if (thought) {
        setSelectedThoughtId(navigateToThoughtId);
        // Reset filter to 'all' to ensure thought is visible
        setQueueFilter('all');
        clearNavigateToThought();
      }
    } else if (!selectedThoughtId && shareThoughts.length > 0) {
      setSelectedThoughtId(shareThoughts[0].id);
    }
  }, [navigateToThoughtId, shareThoughts, selectedThoughtId, clearNavigateToThought, thoughts]);

  // Scroll selected thought into view when it changes
  useEffect(() => {
    if (selectedThoughtId && selectedThoughtRef.current) {
      setTimeout(() => {
        selectedThoughtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedThoughtId]);

  const handleGenerateDrafts = async () => {
    if (!selectedThought || generating) return;
    setGenerating(true);
    try {
      await generateSharePosts(selectedThought.id, selectedThought, retryFeedback || undefined);
      setShowRetryInput(false);
      setRetryFeedback('');
      showToastMessage('Drafts generated!', 'success');
    } catch (error) {
      console.error('Error generating drafts:', error);
      showToastMessage('Failed to generate drafts', 'info');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedThought || generatingImage) return;
    setGeneratingImage(true);
    try {
      await generatePostImage(selectedThought.id);
      showToastMessage('Image generated!', 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      showToastMessage('Failed to generate image', 'info');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleCopyContent = async (platform: Platform) => {
    const content = selectedThought?.sharePosts?.[platform];
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEditStart = (platform: Platform) => {
    const content = selectedThought?.sharePosts?.[platform];
    if (!content) return;
    setEditingPlatform(platform);
    setEditingContent(content);
  };

  const handleEditSave = async () => {
    if (!selectedThought || !editingPlatform || !editingContent.trim()) return;
    const updatedSharePosts = {
      ...selectedThought.sharePosts,
      [editingPlatform]: editingContent.trim(),
    };
    await updateThought(selectedThought.id, { sharePosts: updatedSharePosts });
    setEditingPlatform(null);
    setEditingContent('');
    showToastMessage('Draft saved!', 'success');
  };

  const handleEditCancel = () => {
    setEditingPlatform(null);
    setEditingContent('');
  };

  const handleShare = async (platform: Platform) => {
    const content = selectedThought?.sharePosts?.[platform];
    if (!content || !selectedThought) return;

    await handleCopyContent(platform);

    if (platform === 'linkedin') {
      window.open('https://www.linkedin.com/feed/', '_blank');
      showToastMessage('Content copied! Paste it on LinkedIn', 'info');
    } else if (platform === 'twitter') {
      const encodedContent = encodeURIComponent(content);
      window.open(`https://twitter.com/intent/tweet?text=${encodedContent}`, '_blank');
    } else if (platform === 'instagram') {
      window.open('https://www.instagram.com/', '_blank');
      showToastMessage('Content copied! Paste it on Instagram', 'info');
    }
  };

  const handleMarkAsShared = async (platform: Platform) => {
    if (!selectedThought) return;
    const isCurrentlyShared = selectedThought.sharePosts?.shared?.[platform];
    
    if (isCurrentlyShared) {
      const updatedSharePosts = {
        ...selectedThought.sharePosts,
        shared: {
          ...selectedThought.sharePosts?.shared,
          [platform]: false,
        },
      };
      await updateThought(selectedThought.id, { sharePosts: updatedSharePosts });
      showToastMessage('Marked as draft', 'info');
    } else {
      await markAsShared(selectedThought.id, platform);
      showToastMessage('Marked as shared!', 'success');
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Platform icons
  const LinkedInIcon = () => <Linkedin className="w-5 h-5" />;
  const XIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  const InstagramIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );

  const platformConfig = {
    linkedin: { icon: LinkedInIcon, color: 'text-blue-600', bg: 'bg-blue-50', activeBg: 'bg-blue-100', border: 'border-blue-200' },
    twitter: { icon: XIcon, color: 'text-slate-800', bg: 'bg-slate-50', activeBg: 'bg-slate-100', border: 'border-slate-200' },
    instagram: { icon: InstagramIcon, color: 'text-pink-600', bg: 'bg-pink-50', activeBg: 'bg-pink-100', border: 'border-pink-200' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationNew
        currentView="studio"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {shareThoughts.length === 0 && queueFilter === 'all' ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No thoughts to share yet</h2>
            <p className="text-slate-600 mb-8">
              Mark thoughts as "Share" in Thoughts view to create social media drafts.
            </p>
            <button
              onClick={() => setCurrentView('library')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Go to Thoughts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Share Queue */}
            <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-900">Share Queue</h2>
                  <span className="text-xs text-slate-500">{shareThoughts.length} thoughts</span>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 flex-1">
                    <button
                      onClick={() => setQueueFilter('all')}
                      className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        queueFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setQueueFilter('draft')}
                      className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        queueFilter === 'draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => setQueueFilter('shared')}
                      className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        queueFilter === 'shared' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Shared
                    </button>
                  </div>
                  
                  {/* Sort */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        queueSort === 'potential' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                      }`}
                      title="Sort by"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                        <button
                          onClick={() => { setQueueSort('potential'); setShowFilterMenu(false); }}
                          className={`w-full px-3 py-1.5 text-left text-xs ${queueSort === 'potential' ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          By Potential
                        </button>
                        <button
                          onClick={() => { setQueueSort('newest'); setShowFilterMenu(false); }}
                          className={`w-full px-3 py-1.5 text-left text-xs ${queueSort === 'newest' ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          Newest First
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Thought List */}
              <div ref={thoughtListRef} className="flex-1 overflow-y-auto">
                {shareThoughts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No thoughts match this filter
                  </div>
                ) : (
                  shareThoughts.map((thought) => {
                    const isSelected = thought.id === selectedThought?.id;
                    const hasDrafts = !!thought.sharePosts;
                    const isSharedAny = thought.sharePosts?.shared?.linkedin || 
                                        thought.sharePosts?.shared?.twitter || 
                                        thought.sharePosts?.shared?.instagram;

                    return (
                      <button
                        key={thought.id}
                        ref={isSelected ? selectedThoughtRef : null}
                        onClick={() => setSelectedThoughtId(thought.id)}
                        className={`w-full p-4 text-left transition-all border-l-4 ${
                          isSelected 
                            ? 'bg-violet-50 border-l-violet-600' 
                            : 'border-l-transparent hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-sm leading-relaxed line-clamp-3 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {thought.originalText}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {hasDrafts && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              isSharedAny 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isSharedAny ? 'Shared' : 'Draft'}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(thought.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Content: Draft Editor */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              {selectedThought ? (
                <>
                  {/* Original Thought Card */}
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200/60 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-violet-600 uppercase tracking-wide mb-2">
                          Original Thought
                        </div>
                        <p className="text-slate-800 leading-relaxed">
                          {selectedThought.originalText}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentView('library')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    </div>
                  </div>

                  {/* Generate Drafts CTA or Platform Editor */}
                  {!selectedThought.sharePosts ? (
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-violet-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Generate Post Drafts</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        AI will create optimized drafts for LinkedIn, X, and Instagram.
                      </p>
                      <button
                        onClick={handleGenerateDrafts}
                        disabled={generating}
                        className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Drafts
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                      {/* Platform Tabs - Icons Only */}
                      <div className="flex items-center justify-center gap-2 p-3 bg-slate-50/50 border-b border-slate-100">
                        {(['linkedin', 'twitter', 'instagram'] as Platform[]).map((platform) => {
                          const config = platformConfig[platform];
                          const IconComponent = config.icon;
                          const isActive = activePlatform === platform;
                          const isShared = selectedThought.sharePosts?.shared?.[platform];

                          return (
                            <button
                              key={platform}
                              onClick={() => setActivePlatform(platform)}
                              className={`relative p-3 rounded-xl transition-all ${
                                isActive 
                                  ? `${config.activeBg} ${config.color} shadow-sm` 
                                  : `text-slate-400 hover:text-slate-600 hover:bg-slate-100`
                              }`}
                            >
                              <IconComponent />
                              {isShared && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Draft Content */}
                      <div className="p-6">
                        {editingPlatform === activePlatform ? (
                          <div className="space-y-4">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                              rows={8}
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleEditSave}
                                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <PlatformPreview
                            platform={activePlatform}
                            content={selectedThought.sharePosts?.[activePlatform] || ''}
                            imageUrl={
                              (activePlatform === 'linkedin' || activePlatform === 'instagram')
                                ? selectedThought.sharePosts?.imageUrl
                                : undefined
                            }
                            onCopy={() => handleCopyContent(activePlatform)}
                            copied={copiedPlatform === activePlatform}
                          />
                        )}
                      </div>

                      {/* Action Bar */}
                      {editingPlatform !== activePlatform && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {showRetryInput ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={retryFeedback}
                                  onChange={(e) => setRetryFeedback(e.target.value)}
                                  placeholder="Feedback (optional)..."
                                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                                <button
                                  onClick={handleGenerateDrafts}
                                  disabled={generating}
                                  className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => { setShowRetryInput(false); setRetryFeedback(''); }}
                                  className="p-2 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setShowRetryInput(true)}
                                  className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Retry
                                </button>
                                <button
                                  onClick={() => handleEditStart(activePlatform)}
                                  className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </button>
                                {(activePlatform === 'linkedin' || activePlatform === 'instagram') && (
                                  <button
                                    onClick={handleGenerateImage}
                                    disabled={generatingImage}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      selectedThought.sharePosts?.imageUrl
                                        ? 'text-green-600 hover:bg-green-50'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                    }`}
                                  >
                                    {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                                    {selectedThought.sharePosts?.imageUrl ? 'Image ✓' : 'Image'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyContent(activePlatform)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                copiedPlatform === activePlatform
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <Copy className="w-4 h-4" />
                              {copiedPlatform === activePlatform ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                              onClick={() => handleShare(activePlatform)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Share
                            </button>
                            <button
                              onClick={() => handleMarkAsShared(activePlatform)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedThought.sharePosts?.shared?.[activePlatform]
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {selectedThought.sharePosts?.shared?.[activePlatform] ? '✓ Shared' : 'Mark Shared'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-slate-500">
                  Select a thought from the queue
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
            showToast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-slate-900 border border-slate-200'
          }`}>
            {showToast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            <span className="font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {showFilterMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
      )}
    </div>
  );
};

export default ShareStudioView;
