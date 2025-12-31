import React, { useState, useMemo } from 'react';
import { useGenieNotesStore } from '../store';
import { Thought } from '../types';
import { Share2, Linkedin, Twitter, Instagram, Loader2, ExternalLink, CheckCircle2, BarChart3, RefreshCw, X, Copy } from 'lucide-react';
import Navigation from './Navigation';
import { PlatformPreview } from './PlatformPreviews';

type Platform = 'linkedin' | 'twitter' | 'instagram';

const ShareItView: React.FC = () => {
  const {
    thoughts,
    loading,
    user,
    signOut,
    setCurrentView,
    generateSharePosts,
    markAsShared,
    loadThoughts,
    addSpark,
    removeSpark,
  } = useGenieNotesStore();

  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('linkedin');
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [retryModal, setRetryModal] = useState<{ thoughtId: string } | null>(null);
  const [retrySuggestion, setRetrySuggestion] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'virality'>('newest');
  const [showShareToast, setShowShareToast] = useState<{ platform: Platform; visible: boolean } | null>(null);

  // Filter and sort thoughts that have Share potential
  const shareThoughts = useMemo(() => {
    let filtered = thoughts.filter(thought => {
      const potential = thought.potential || thought.bestPotential;
      return potential === 'Share';
    });

    // Sort based on selected order
    if (sortOrder === 'virality') {
      // Sort by: isSpark first, then by creation date (newer = more recent = potentially more viral)
      filtered = [...filtered].sort((a, b) => {
        // Sparks first
        if (a.isSpark && !b.isSpark) return -1;
        if (!a.isSpark && b.isSpark) return 1;
        // Then by date (newer first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Sort by newest first
      filtered = [...filtered].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return filtered;
  }, [thoughts, sortOrder]);

  const selectedThought = useMemo(() => {
    return shareThoughts.find(t => t.id === selectedThoughtId) || shareThoughts[0] || null;
  }, [shareThoughts, selectedThoughtId]);

  // Analytics
  const analytics = useMemo(() => {
    const totalThoughts = shareThoughts.length;
    const withDrafts = shareThoughts.filter(t => t.sharePosts).length;
    const sharedCounts = {
      linkedin: shareThoughts.filter(t => t.sharePosts?.shared?.linkedin).length,
      twitter: shareThoughts.filter(t => t.sharePosts?.shared?.twitter).length,
      instagram: shareThoughts.filter(t => t.sharePosts?.shared?.instagram).length,
    };
    const totalShared = Object.values(sharedCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      totalThoughts,
      withDrafts,
      sharedCounts,
      totalShared,
    };
  }, [shareThoughts]);

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
        // Copy content first
        await handleCopyPost(content, thoughtId, platform);
        // Show toast notification
        setShowShareToast({ platform: 'linkedin', visible: true });
        setTimeout(() => setShowShareToast(null), 5000);
        // Open LinkedIn feed - user needs to click "Start a post" to open composer
        // LinkedIn doesn't support direct URL to open composer
        window.open('https://www.linkedin.com/feed/', '_blank', 'noopener,noreferrer');
        break;
      case 'twitter':
        const encodedContent = encodeURIComponent(content);
        const url = `https://twitter.com/intent/tweet?text=${encodedContent}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        markAsShared(thoughtId, platform);
        break;
      case 'instagram':
        // Copy content first
        await handleCopyPost(content, thoughtId, platform);
        // Show toast notification
        setShowShareToast({ platform: 'instagram', visible: true });
        setTimeout(() => setShowShareToast(null), 5000);
        // Open Instagram in new tab
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        break;
      default:
        return;
    }
  };

  const handleMarkAsShared = async (thoughtId: string, platform: Platform) => {
    await markAsShared(thoughtId, platform);
  };

  const handleRetryDraft = async () => {
    if (!retryModal) return;
    const { thoughtId } = retryModal;
    if (generating[thoughtId]) return;
    
    setGenerating(prev => ({ ...prev, [thoughtId]: true }));
    
    try {
      const thought = thoughts.find(t => t.id === thoughtId);
      if (!thought) return;
      
      // Use the same generateSharePosts function that generates all platforms
      // Pass user feedback separately to preserve original thought structure
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

  // Auto-select first thought if none selected, or navigate to specific thought
  React.useEffect(() => {
    const navigateToThought = sessionStorage.getItem('navigateToThought');
    if (navigateToThought && shareThoughts.some(t => t.id === navigateToThought)) {
      setSelectedThoughtId(navigateToThought);
      sessionStorage.removeItem('navigateToThought');
    } else if (!selectedThoughtId && shareThoughts.length > 0) {
      setSelectedThoughtId(shareThoughts[0].id);
    }
  }, [shareThoughts, selectedThoughtId]);

  // Handle navigation from Thoughts view - check if thoughtId is in URL or store
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const thoughtId = urlParams.get('thoughtId');
    if (thoughtId && shareThoughts.some(t => t.id === thoughtId)) {
      setSelectedThoughtId(thoughtId);
      // Clean up URL
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column: List of Thoughts (Narrower) */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-slate-900">Thoughts</h2>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'virality')}
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="virality">Spark First</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">{shareThoughts.length} total</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  {shareThoughts.map((thought) => {
                    const isSelected = thought.id === selectedThoughtId;
                    const hasPosts = !!thought.sharePosts;
                    const isGen = generating[thought.id];
                    const isShared = thought.sharePosts?.shared?.linkedin || 
                                    thought.sharePosts?.shared?.twitter || 
                                    thought.sharePosts?.shared?.instagram;

                    return (
                      <div
                        key={thought.id}
                        className={`w-full p-3 transition-colors h-24 flex flex-col justify-between border rounded-lg ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 border-l-4 border-l-indigo-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-1.5 flex-1">
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
                          <button
                            onClick={() => setSelectedThoughtId(thought.id)}
                            className="flex-1 text-left"
                          >
                            <p className={`text-xs leading-snug line-clamp-3 ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-800'}`}>
                              {thought.originalText}
                            </p>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {hasPosts && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">
                              Draft
                            </span>
                          )}
                          {isShared && (
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

            {/* Right Column: Selected Thought + Social Tabs + Analytics */}
            <div className="lg:col-span-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Content Area - Simplified */}
              <div className="xl:col-span-2 bg-white rounded-xl shadow-sm overflow-visible flex flex-col">
                {selectedThought ? (
                  <>
                    {/* Simplified Header: Platform Tabs + Actions */}
                    {selectedThought.sharePosts ? (
                      <div className="p-3 flex items-center justify-between flex-shrink-0">
                        {/* Platform Tabs */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActivePlatform('linkedin')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                              activePlatform === 'linkedin'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Linkedin className="w-4 h-4" />
                            {selectedThought.sharePosts?.shared?.linkedin && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setActivePlatform('twitter')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                              activePlatform === 'twitter'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Twitter className="w-4 h-4" />
                            {selectedThought.sharePosts?.shared?.twitter && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setActivePlatform('instagram')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                              activePlatform === 'instagram'
                                ? 'bg-pink-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Instagram className="w-4 h-4" />
                            {selectedThought.sharePosts?.shared?.instagram && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Actions - Simplified */}
                        <div className="flex items-center gap-1.5">
                          {activePlatform === 'linkedin' && selectedThought.sharePosts.linkedin && (
                            <>
                              <button
                                onClick={() => handleSharePost('linkedin', selectedThought.sharePosts!.linkedin!, selectedThought.id)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                title="Share on LinkedIn"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyPost(selectedThought.sharePosts!.linkedin!, selectedThought.id, 'linkedin')}
                                className={`p-2 rounded-lg transition-colors ${
                                  copiedPost === `${selectedThought.id}-linkedin`
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Copy"
                              >
                                {copiedPost === `${selectedThought.id}-linkedin` ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setRetryModal({ thoughtId: selectedThought.id })}
                                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Regenerate all platforms"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              {!selectedThought.sharePosts.shared?.linkedin && (
                                <button
                                  onClick={() => handleMarkAsShared(selectedThought.id, 'linkedin')}
                                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Mark as Shared"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {activePlatform === 'twitter' && selectedThought.sharePosts.twitter && (
                            <>
                              <button
                                onClick={() => handleSharePost('twitter', selectedThought.sharePosts!.twitter!, selectedThought.id)}
                                className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title="Share on X"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyPost(selectedThought.sharePosts!.twitter!, selectedThought.id, 'twitter')}
                                className={`p-2 rounded-lg transition-colors ${
                                  copiedPost === `${selectedThought.id}-twitter`
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Copy"
                              >
                                {copiedPost === `${selectedThought.id}-twitter` ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              {!selectedThought.sharePosts.shared?.twitter && (
                                <button
                                  onClick={() => handleMarkAsShared(selectedThought.id, 'twitter')}
                                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Mark as Shared"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {activePlatform === 'instagram' && selectedThought.sharePosts.instagram && (
                            <>
                              <button
                                onClick={() => handleSharePost('instagram', selectedThought.sharePosts!.instagram!, selectedThought.id)}
                                className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                                title="Copy for Instagram"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyPost(selectedThought.sharePosts!.instagram!, selectedThought.id, 'instagram')}
                                className={`p-2 rounded-lg transition-colors ${
                                  copiedPost === `${selectedThought.id}-instagram`
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Copy"
                              >
                                {copiedPost === `${selectedThought.id}-instagram` ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              {!selectedThought.sharePosts.shared?.instagram && (
                                <button
                                  onClick={() => handleMarkAsShared(selectedThought.id, 'instagram')}
                                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Mark as Shared"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Post Content Area - Simplified */}
                    <div className="p-4">
                      {/* Raw Thought - Inline, less prominent */}
                      <div className="mb-4 pb-3 border-b border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">Raw Thought</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{selectedThought.originalText}</p>
                      </div>
                      
                      {!selectedThought.sharePosts ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Share2 className="w-12 h-12 text-slate-400 mb-4" />
                          <p className="text-slate-600 mb-4">Generate post drafts for all platforms</p>
                          <button
                            onClick={() => handleGeneratePosts(selectedThought.id)}
                            disabled={generating[selectedThought.id]}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {generating[selectedThought.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4" />
                                Generate Posts
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          {activePlatform === 'linkedin' && selectedThought.sharePosts.linkedin && (
                            <PlatformPreview
                              platform="linkedin"
                              content={selectedThought.sharePosts.linkedin}
                              onCopy={() => handleCopyPost(selectedThought.sharePosts!.linkedin!, selectedThought.id, 'linkedin')}
                              copied={copiedPost === `${selectedThought.id}-linkedin`}
                            />
                          )}

                          {activePlatform === 'twitter' && selectedThought.sharePosts.twitter && (
                            <PlatformPreview
                              platform="twitter"
                              content={selectedThought.sharePosts.twitter}
                              onCopy={() => handleCopyPost(selectedThought.sharePosts!.twitter!, selectedThought.id, 'twitter')}
                              copied={copiedPost === `${selectedThought.id}-twitter`}
                            />
                          )}

                          {activePlatform === 'instagram' && selectedThought.sharePosts.instagram && (
                            <PlatformPreview
                              platform="instagram"
                              content={selectedThought.sharePosts.instagram}
                              onCopy={() => handleCopyPost(selectedThought.sharePosts!.instagram!, selectedThought.id, 'instagram')}
                              copied={copiedPost === `${selectedThought.id}-instagram`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    Select a thought to view details
                  </div>
                )}
              </div>

              {/* Analytics Sidebar */}
              <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.totalThoughts}</div>
                    <div className="text-sm text-slate-600">Total Thoughts</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-indigo-600 mb-1">{analytics.withDrafts}</div>
                    <div className="text-sm text-slate-600">With Drafts</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">{analytics.totalShared}</div>
                    <div className="text-sm text-slate-600">Total Shared</div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 mb-3">By Platform</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-600">LinkedIn</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{analytics.sharedCounts.linkedin}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-slate-700" />
                          <span className="text-sm text-slate-600">X (Twitter)</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{analytics.sharedCounts.twitter}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          <span className="text-sm text-slate-600">Instagram</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{analytics.sharedCounts.instagram}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
              Provide feedback to improve all drafts (LinkedIn, Twitter, Instagram) - optional:
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
                    Regenerating all platforms...
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
