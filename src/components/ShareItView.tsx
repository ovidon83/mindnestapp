import React, { useState, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { Entry, Post } from '../types';
import { fetchPosts, updatePostDraft, deletePost, generatePostForEntry } from '../lib/posts';
import { fetchEntries } from '../lib/db';
import { Share2, Copy, Check, X, Linkedin, Twitter, Instagram, Edit2, Trash2, Loader2, RefreshCcw, Sparkles } from 'lucide-react';

const ShareItView: React.FC = () => {
  const { entries, setCurrentView, updateEntry, user, signOut } = useGenieNotesStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [editingPlatform, setEditingPlatform] = useState<'linkedin' | 'twitter' | 'instagram' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'linkedin' | 'twitter' | 'instagram'>>({});
  const [generatingPosts, setGeneratingPosts] = useState<Set<string>>(new Set());
  const [failedGenerations, setFailedGenerations] = useState<Set<string>>(new Set());
  const [hasCheckedForMissingDrafts, setHasCheckedForMissingDrafts] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [generationAttempts, setGenerationAttempts] = useState<Record<string, number>>({});
  const [generationProgress, setGenerationProgress] = useState<Record<string, string>>({});

  // Get entries that are in Share it, ordered by last added (most recent first)
  // We'll use updatedAt to track when it was added to ShareIt
  const shareItEntries = entries
    .filter(e => e.inShareIt)
    .sort((a, b) => {
      // Sort by updatedAt (when added to ShareIt) or createdAt as fallback
      const aTime = a.updatedAt?.getTime() || a.createdAt.getTime();
      const bTime = b.updatedAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime; // Most recent first
    });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get entry for a post
  const getEntryForPost = (entryId: string): Entry | undefined => {
    return entries.find(e => e.id === entryId);
  };

  // Handle manual add to Share it
  const handleAddToShareIt = async (entry: Entry) => {
    setGeneratingPosts(prev => new Set(prev).add(entry.id));
    try {
      await updateEntry(entry.id, { inShareIt: true });
      // Generate drafts immediately - force generation regardless of score/type since manually added
      await generatePostForEntry(entry.id, true);
      await loadPosts();
    } catch (error: any) {
      console.error('Error adding to Share it:', error);
      if (error?.message?.includes('quota exceeded') || error?.isQuotaExceeded) {
        alert('OpenAI API usage limit reached (TPM/RPM). This is usually a per-minute or per-day request limit, not your budget. Please wait a few minutes and try again, or check your API key usage limits in OpenAI dashboard.');
      } else {
        alert('Error adding to Share it. Please try again.');
      }
    } finally {
      setGeneratingPosts(prev => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  // Handle remove from Share it
  const handleRemoveFromShareIt = async (entryId: string) => {
    await updateEntry(entryId, { inShareIt: false });
    // Also delete the post
    try {
      await deletePost(entryId);
      await loadPosts();
    } catch (error) {
      console.error('Error removing from Share it:', error);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  // Handle mark as shared
  const handleMarkAsShared = async (postId: string) => {
    try {
      // Update post status to 'posted'
      const post = posts.find(p => p.id === postId);
      if (post) {
        // We'll need to add updatePostStatus function or handle this differently
        // For now, just mark the entry
        await updateEntry(post.entryId, { inShareIt: false });
        await loadPosts();
      }
    } catch (error) {
      console.error('Error marking as shared:', error);
    }
  };

  // Handle edit draft
  const handleEditDraft = (post: Post, platform: 'linkedin' | 'twitter' | 'instagram') => {
    setEditingPostId(post.id);
    setEditingPlatform(platform);
    if (platform === 'linkedin') {
      setEditingDraft(post.draftContent);
    } else if (platform === 'twitter') {
      setEditingDraft(post.twitterContent || '');
    } else {
      setEditingDraft(post.instagramContent || '');
    }
  };

  // Handle save draft
  const handleSaveDraft = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post || !editingPlatform) return;

      if (editingPlatform === 'linkedin') {
        await updatePostDraft(postId, editingDraft);
      } else if (editingPlatform === 'twitter') {
        // Need to update twitter content
        await updatePostDraft(postId, post.draftContent, editingDraft);
      } else {
        // Need to update instagram content
        await updatePostDraft(postId, post.draftContent, undefined, editingDraft);
      }

      setEditingPostId(null);
      setEditingPlatform(null);
      setEditingDraft('');
      await loadPosts();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Content */}
      <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
        {shareItEntries.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Share2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
              No thoughts in Share it yet
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6 px-4 max-w-md mx-auto">
              Thoughts with sharing potential will appear here automatically, or you can add them manually from Mindbox.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shareItEntries.map((entry) => {
              const post = posts.find(p => p.entryId === entry.id);
              const currentTab = activeTab[entry.id] || 'linkedin';
              
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-full hover:border-slate-300 transition-all duration-200"
                >
                  {/* Original Thought */}
                  <div className="p-5 flex-1 flex flex-col min-h-0">
                    <div className="text-sm text-slate-900 leading-relaxed flex-1 overflow-hidden mb-4">
                      <div className="line-clamp-4">
                        {entry.originalText}
                      </div>
                    </div>
                    
                    {/* Generate Post Button - Prominent */}
                    {!post && !generatingPosts.has(entry.id) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setGeneratingPosts(prev => new Set(prev).add(entry.id));
                          setGenerationProgress(prev => ({ ...prev, [entry.id]: 'Creating LinkedIn draft...' }));
                          try {
                            // Update progress as we go (approximate timing)
                            setTimeout(() => setGenerationProgress(prev => ({ ...prev, [entry.id]: 'Creating Twitter post...' })), 2000);
                            setTimeout(() => setGenerationProgress(prev => ({ ...prev, [entry.id]: 'Creating Instagram caption...' })), 4000);
                            setTimeout(() => setGenerationProgress(prev => ({ ...prev, [entry.id]: 'Generating Instagram image...' })), 6000);
                            
                            await generatePostForEntry(entry.id, true);
                            await loadPosts();
                            // Auto-expand after generation
                            setExpandedCards(prev => new Set(prev).add(entry.id));
                            setFailedGenerations(prev => {
                              const next = new Set(prev);
                              next.delete(entry.id);
                              return next;
                            });
                            setGenerationProgress(prev => {
                              const next = { ...prev };
                              delete next[entry.id];
                              return next;
                            });
                          } catch (error: any) {
                            console.error(`Error generating drafts for entry ${entry.id}:`, error);
                            setFailedGenerations(prev => new Set(prev).add(entry.id));
                            setGenerationProgress(prev => {
                              const next = { ...prev };
                              delete next[entry.id];
                              return next;
                            });
                            if (error?.message?.includes('quota exceeded') || error?.isQuotaExceeded || error?.error?.code === 'insufficient_quota') {
                              alert('OpenAI API usage limit reached (TPM/RPM). Please wait a few minutes and try again.');
                            } else {
                              alert('Error generating post drafts. Please try again.');
                            }
                          } finally {
                            setGeneratingPosts(prev => {
                              const next = new Set(prev);
                              next.delete(entry.id);
                              return next;
                            });
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-800 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Post Drafts
                      </button>
                    )}
                    
                    {/* Generating State with Progress */}
                    {generatingPosts.has(entry.id) && (
                      <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-700">
                            {generationProgress[entry.id] || 'Generating drafts...'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-slate-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Expand/Collapse Button */}
                    {post && (
                      <button
                        onClick={() => {
                          setExpandedCards(prev => {
                            const next = new Set(prev);
                            if (next.has(entry.id)) {
                              next.delete(entry.id);
                            } else {
                              next.add(entry.id);
                            }
                            return next;
                          });
                        }}
                        className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
                      >
                        <span>{expandedCards.has(entry.id) ? 'Hide' : 'View'} Drafts</span>
                        <svg className={`w-4 h-4 transition-transform ${expandedCards.has(entry.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Tabs and Content - Only show when expanded and post exists */}
                  {expandedCards.has(entry.id) && post ? (
                    <>
                      {/* Tabs */}
                      <div className="border-t border-slate-100">
                        <div className="flex border-b border-slate-100">
                      {['linkedin', 'twitter', 'instagram'].map((platform) => {
                        const isActive = currentTab === platform;
                        const iconMap = {
                          linkedin: Linkedin,
                          twitter: Twitter,
                          instagram: Instagram,
                        };
                        const colorMap = {
                          linkedin: 'text-blue-600',
                          twitter: 'text-sky-500',
                          instagram: 'text-amber-600',
                        };
                        const Icon = iconMap[platform as keyof typeof iconMap];
                        const color = colorMap[platform as keyof typeof colorMap];
                        
                        return (
                          <button
                            key={platform}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newTab = platform as 'linkedin' | 'twitter' | 'instagram';
                              setActiveTab({ ...activeTab, [entry.id]: newTab });
                              
                              // Don't auto-generate on tab click - generation happens on mount and expand
                              // Just switch tabs
                            }}
                            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                              isActive
                                ? 'border-b-2 border-slate-700 text-slate-700 bg-slate-50'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? color : 'text-slate-400'}`} />
                            <span className="capitalize hidden sm:inline">{platform === 'twitter' ? 'X' : platform}</span>
                          </button>
                        );
                      })}
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="p-5 max-h-[400px] overflow-y-auto">
                        {currentTab === 'linkedin' && (
                          <div>
                            {!post.draftContent && generatingPosts.has(entry.id) ? (
                              <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-600 mb-2" />
                                <div className="text-xs text-slate-600">Generating...</div>
                              </div>
                            ) : (
                              <>
                            <div className="flex items-center justify-end mb-2">
                              <div className="flex items-center gap-1">
                                {editingPostId === post.id && editingPlatform === 'linkedin' ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveDraft(post.id)}
                                      className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingPostId(null);
                                        setEditingPlatform(null);
                                        setEditingDraft('');
                                      }}
                                      className="px-4 py-2 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={async () => {
                                        setGeneratingPosts(prev => new Set(prev).add(entry.id));
                                        try {
                                          await deletePost(post.id);
                                          await generatePostForEntry(entry.id);
                                          await loadPosts();
                                        } catch (error) {
                                          console.error('Error regenerating draft:', error);
                                          alert('Error regenerating draft. Please try again.');
                                        } finally {
                                          setGeneratingPosts(prev => {
                                            const next = new Set(prev);
                                            next.delete(entry.id);
                                            return next;
                                          });
                                        }
                                      }}
                                      className="p-1.5 border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 rounded transition-colors"
                                      title="Regenerate"
                                    >
                                      <RefreshCcw className="w-3 h-3" />
                                    </button>
                                    {post.draftContent && (
                                      <>
                                        <button
                                          onClick={() => handleCopy(post.draftContent, `linkedin-${post.id}`)}
                                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                          title="Copy"
                                        >
                                          {copiedId === `linkedin-${post.id}` ? (
                                            <Check className="w-3 h-3 text-green-600" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleEditDraft(post, 'linkedin')}
                                          className="p-1.5 border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {editingPostId === post.id && editingPlatform === 'linkedin' ? (
                              <textarea
                                value={editingDraft}
                                onChange={(e) => setEditingDraft(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[150px] text-xs leading-relaxed"
                                placeholder="Edit LinkedIn draft..."
                              />
                            ) : (
                              <div className="space-y-2">
                                {post.draftContent ? (
                                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-[300px] overflow-y-auto">
                                    {post.draftContent}
                                  </div>
                                ) : generatingPosts.has(entry.id) ? (
                                  <div className="flex flex-col items-center justify-center py-8 border border-slate-200 rounded bg-slate-50">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-600 mb-2" />
                                    <div className="text-xs text-slate-600">Generating LinkedIn draft...</div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                            </>
                            )}
                          </div>
                        )}

                        {currentTab === 'twitter' && (
                          <div>
                            {!post.twitterContent && generatingPosts.has(entry.id) ? (
                              <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-600 mb-2" />
                                <div className="text-xs text-slate-600">Generating...</div>
                              </div>
                            ) : (
                              <>
                            <div className="flex items-center justify-between mb-2">
                              {post.twitterContent && (
                                <div className="text-xs text-slate-400">
                                  {post.twitterContent.length}/280
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                {editingPostId === post.id && editingPlatform === 'twitter' ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveDraft(post.id)}
                                      className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingPostId(null);
                                        setEditingPlatform(null);
                                        setEditingDraft('');
                                      }}
                                      className="px-4 py-2 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={async () => {
                                        setGeneratingPosts(prev => new Set(prev).add(entry.id));
                                        try {
                                          await deletePost(post.id);
                                          await generatePostForEntry(entry.id);
                                          await loadPosts();
                                        } catch (error) {
                                          console.error('Error regenerating draft:', error);
                                          alert('Error regenerating draft. Please try again.');
                                        } finally {
                                          setGeneratingPosts(prev => {
                                            const next = new Set(prev);
                                            next.delete(entry.id);
                                            return next;
                                          });
                                        }
                                      }}
                                      className="p-2 border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 rounded transition-colors"
                                      title="Regenerate draft"
                                    >
                                      <RefreshCcw className="w-3.5 h-3.5" />
                                    </button>
                                    {post.twitterContent && (
                                      <>
                                        <button
                                          onClick={() => handleCopy(post.twitterContent || '', `twitter-${post.id}`)}
                                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                          title="Copy"
                                        >
                                          {copiedId === `twitter-${post.id}` ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <Copy className="w-4 h-4" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleEditDraft(post, 'twitter')}
                                          className="p-2 border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {editingPostId === post.id && editingPlatform === 'twitter' ? (
                              <div>
                                <textarea
                                  value={editingDraft}
                                  onChange={(e) => setEditingDraft(e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] text-xs"
                                  placeholder="Edit X draft..."
                                  maxLength={280}
                                />
                                <div className="mt-1 text-xs text-slate-500 text-right">
                                  {editingDraft.length}/280
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {post.twitterContent ? (
                                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 max-h-[300px] overflow-y-auto">
                                    <div className="whitespace-pre-wrap">{post.twitterContent}</div>
                                  </div>
                                ) : generatingPosts.has(entry.id) ? (
                                  <div className="flex flex-col items-center justify-center py-8 border border-slate-200 rounded bg-slate-50">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-600 mb-2" />
                                    <div className="text-xs text-slate-600">Generating Twitter post...</div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                            </>
                            )}
                          </div>
                        )}

                        {currentTab === 'instagram' && (
                          <div>
                            {!post.instagramContent && generatingPosts.has(entry.id) ? (
                              <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-600 mb-2" />
                                <div className="text-xs text-slate-600">Generating...</div>
                              </div>
                            ) : (
                              <>
                            <div className="flex items-center justify-end mb-2 gap-1">
                              {editingPostId === post.id && editingPlatform === 'instagram' ? (
                                <>
                                  <button
                                    onClick={() => handleSaveDraft(post.id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPostId(null);
                                      setEditingPlatform(null);
                                      setEditingDraft('');
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  {post.instagramContent && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          setGeneratingPosts(prev => new Set(prev).add(entry.id));
                                          try {
                                            await deletePost(post.id);
                                            await generatePostForEntry(entry.id);
                                            await loadPosts();
                                          } catch (error) {
                                            console.error('Error regenerating draft:', error);
                                            alert('Error regenerating draft. Please try again.');
                                          } finally {
                                            setGeneratingPosts(prev => {
                                              const next = new Set(prev);
                                              next.delete(entry.id);
                                              return next;
                                            });
                                          }
                                        }}
                                        className="px-2 py-1 text-xs font-medium border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 rounded transition-colors"
                                        title="Regenerate draft"
                                      >
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleCopy(post.instagramContent || '', `instagram-${post.id}`)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                        title="Copy"
                                      >
                                        {copiedId === `instagram-${post.id}` ? (
                                          <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleEditDraft(post, 'instagram')}
                                        className="p-2 border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            {editingPostId === post.id && editingPlatform === 'instagram' ? (
                              <textarea
                                value={editingDraft}
                                onChange={(e) => setEditingDraft(e.target.value)}
                                className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[150px] text-sm"
                                placeholder="Edit Instagram caption..."
                              />
                            ) : (
                              <div className="space-y-3">
                                {/* Image Section */}
                                {post.instagramImageUrl ? (
                                  <div className="bg-white border border-slate-200 rounded overflow-hidden">
                                    <div className="aspect-square bg-black flex items-center justify-center">
                                      <img
                                        src={post.instagramImageUrl}
                                        alt="Instagram post"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg aspect-square flex flex-col items-center justify-center p-6">
                                    {generatingPosts.has(entry.id) ? (
                                      <>
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                                        <div className="text-sm font-medium text-slate-700 mb-1">Generating image...</div>
                                        <div className="text-xs text-slate-500">This may take 5-10 seconds</div>
                                      </>
                                    ) : (
                                      <>
                                        <Instagram className="w-8 h-8 text-slate-400 mb-2" />
                                        <div className="text-xs text-slate-500">Image not generated</div>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                {/* Caption Section - Show immediately when available */}
                                {post.instagramContent && (
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="text-xs font-medium text-slate-600 mb-1.5">Caption:</div>
                                    <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
                                      {post.instagramContent}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            </>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                  
                  {/* Actions - Always visible */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromShareIt(entry.id);
                      }}
                      className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                    {post && (
                      <div className="flex items-center gap-2">
                        {post.status === 'shared' ? (
                          <div className="px-3 py-1.5 text-xs font-medium bg-green-50 border border-green-200 text-green-700 rounded flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Shared</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsShared(post.id);
                            }}
                            className="px-4 py-2 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mark as Shared</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareItView;

