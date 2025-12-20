import React, { useState, useEffect, Fragment } from 'react';
import { useGenieNotesStore } from '../store';
import { Post, PostStatus } from '../types';
import { fetchPosts, updatePostStatus, updatePostDraft, deletePost, regenerateSocialContent } from '../lib/posts';
import { Sparkles, CheckCircle, X, Edit2, Trash2, TrendingUp, ChevronDown, Linkedin, Twitter, Instagram, Image as ImageIcon } from 'lucide-react';
import UserAvatar from './UserAvatar';

type PostPlatform = 'linkedin' | 'twitter' | 'instagram';

const PostsView: React.FC = () => {
  const { setCurrentView, entries, user, signOut } = useGenieNotesStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isCheckingPosts, setIsCheckingPosts] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, PostPlatform>>({});
  const [regeneratingPosts, setRegeneratingPosts] = useState<Set<string>>(new Set());
  
  const getSelectedPlatform = (postId: string): PostPlatform => {
    return selectedPlatforms[postId] || 'linkedin';
  };
  
  const setSelectedPlatform = async (postId: string, platform: PostPlatform) => {
    setSelectedPlatforms(prev => ({ ...prev, [postId]: platform }));
    
    // Check if we need to regenerate content for this platform
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Check if content is missing for the selected platform
    const needsRegeneration = 
      (platform === 'twitter' && !post.twitterContent) ||
      (platform === 'instagram' && (!post.instagramContent || !post.instagramImagePrompt));
    
    if (needsRegeneration && !regeneratingPosts.has(postId)) {
      setRegeneratingPosts(prev => new Set(prev).add(postId));
      try {
        await regenerateSocialContent(postId);
        await loadPosts(); // Reload to show new content
      } catch (error) {
        console.error('Error regenerating social content:', error);
      } finally {
        setRegeneratingPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    }
  };

  useEffect(() => {
    loadPosts();
    // Automatically check for new posts when Posts view is opened (only once)
    checkForNewPosts();
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

  const checkForNewPosts = async () => {
    // Prevent concurrent calls
    if (isCheckingPosts) return;
    
    setIsCheckingPosts(true);
    try {
      const { generateNextPost } = await import('../lib/posts');
      // Only generate ONE post at a time
      const newPost = await generateNextPost();
      if (newPost) {
        // Reload posts to show the new one
        await loadPosts();
      }
    } catch (error) {
      // Silently fail - post generation is optional
      console.error('Error checking for new posts:', error);
    } finally {
      setIsCheckingPosts(false);
    }
  };


  const handleStatusChange = async (postId: string, newStatus: PostStatus) => {
    try {
      await updatePostStatus(postId, newStatus);
      await loadPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Failed to update post status.');
    }
  };

  const handleEditDraft = (post: Post) => {
    setEditingPostId(post.id);
    setEditingDraft(post.draftContent);
  };

  const handleSaveDraft = async (postId: string) => {
    try {
      await updatePostDraft(postId, editingDraft);
      setEditingPostId(null);
      setEditingDraft('');
      await loadPosts();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'ready': return 'bg-blue-100 text-blue-700';
      case 'posted': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-slate-200 text-slate-600';
    }
  };

  const getViralityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 30) return 'text-amber-600';
    return 'text-slate-600';
  };

  const filteredPosts = statusFilter === 'all' 
    ? posts 
    : posts.filter(p => p.status === statusFilter);

  const getEntryForPost = (entryId: string) => {
    return entries.find(e => e.id === entryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header - Status Filter Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-8 py-3 sm:py-4">
          {/* Status Filter Tabs - Scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max sm:min-w-0">
              {(['all', 'draft', 'ready', 'posted', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="w-full px-4 sm:px-8 py-4 sm:py-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">
              {posts.length === 0 ? 'No posts yet' : 'No posts match this filter'}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 px-4">
              {posts.length === 0 
                ? 'Posts are automatically generated when you create insights worth sharing'
                : 'Try selecting a different status filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2">
            {filteredPosts.map((post) => {
              const entry = getEntryForPost(post.entryId);
              const isExpanded = expandedPostId === post.id;
              const previewText = post.draftContent 
                ? post.draftContent.split('\n')[0].substring(0, 120) + (post.draftContent.split('\n')[0].length > 120 ? '...' : '')
                : 'No draft content';
              
              return (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Compact Row View (Default) */}
                  {!isExpanded ? (
                    <div 
                      className="p-3 sm:p-4 cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px]"
                      onClick={() => setExpandedPostId(post.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap bg-slate-100 text-slate-700 flex-shrink-0`}>
                            {post.status}
                          </div>
                          <div className={`flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${getViralityColor(post.viralityScore)}`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">{post.viralityScore}</span>
                          </div>
                          <div className="flex-1 text-xs sm:text-sm text-slate-700 truncate min-w-0">
                            {previewText}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 sm:ml-2 flex-shrink-0">
                          {entry && (
                            <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">
                              {entry.category}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {post.draftContent.length} chars
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Expanded View */
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </div>
                            <div className={`flex items-center gap-1 ${getViralityColor(post.viralityScore)}`}>
                              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="text-xs sm:text-sm font-semibold">{post.viralityScore}</span>
                              <span className="text-xs text-slate-500 hidden sm:inline">virality</span>
                            </div>
                            {entry && (
                              <div className="text-xs text-slate-500">
                                From: {entry.category} • {entry.entryType}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPostId(null);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Collapse"
                          >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDraft(post);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Edit draft"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Draft Content */}
                      {editingPostId === post.id ? (
                        <div className="mb-4">
                          <textarea
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            className="w-full p-3 sm:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[200px] text-sm sm:text-base font-sans"
                            placeholder="Edit your post draft..."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-slate-500">
                              {editingDraft.length} characters
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveDraft(post.id);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Save Draft
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPostId(null);
                                  setEditingDraft('');
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                  ) : (
                    <div className="mb-4">
                      {/* Platform Tabs */}
                      <div className="flex items-center gap-1 sm:gap-2 mb-4 border-b border-slate-200 overflow-x-auto scrollbar-hide">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlatform(post.id, 'linkedin');
                          }}
                          className={`px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
                            getSelectedPlatform(post.id) === 'linkedin'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlatform(post.id, 'twitter');
                          }}
                          className={`px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
                            getSelectedPlatform(post.id) === 'twitter'
                              ? 'border-sky-500 text-sky-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Twitter className="w-4 h-4" />
                          <span className="hidden sm:inline">Twitter/X</span>
                          <span className="sm:hidden">X</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlatform(post.id, 'instagram');
                          }}
                          className={`px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
                            getSelectedPlatform(post.id) === 'instagram'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </button>
                      </div>

                      {/* LinkedIn Preview */}
                      {getSelectedPlatform(post.id) === 'linkedin' && (
                        <div>
                          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                Y
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">Your Name</div>
                                <div className="text-xs text-slate-500">Just now</div>
                              </div>
                            </div>
                            <div className="p-4">
                              <div 
                                className="text-slate-900 leading-relaxed whitespace-pre-line text-[14px] font-normal"
                                style={{ 
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                  lineHeight: '1.6',
                                  whiteSpace: 'pre-line'
                                }}
                              >
                                {post.draftContent ? (
                                  post.draftContent.split('\n').map((line, i) => (
                                    <Fragment key={i}>
                                      {line.trim() ? (
                                        <div className="mb-3">{line.trim()}</div>
                                      ) : (
                                        <div className="mb-2"></div>
                                      )}
                                    </Fragment>
                                  ))
                                ) : (
                                  <div className="text-slate-400 italic">Generating LinkedIn post...</div>
                                )}
                              </div>
                            </div>
                          </div>
                          {post.draftContent && (
                            <div className="mt-2 text-xs text-slate-500 text-right">
                              {post.draftContent.length} characters
                            </div>
                          )}
                        </div>
                      )}

                      {/* Twitter/X Preview */}
                      {getSelectedPlatform(post.id) === 'twitter' && (
                        <div>
                          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold">
                                Y
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">Your Name</div>
                                <div className="text-xs text-slate-500">@yourhandle · Just now</div>
                              </div>
                            </div>
                            <div className="p-4">
                              <div 
                                className="text-slate-900 leading-relaxed whitespace-pre-line text-[15px] font-normal"
                                style={{ 
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                  lineHeight: '1.5'
                                }}
                              >
                                {regeneratingPosts.has(post.id) ? (
                                  <div className="text-slate-400 italic">Generating Twitter/X post...</div>
                                ) : post.twitterContent ? (
                                  post.twitterContent.split('\n').map((line, i) => (
                                    <Fragment key={i}>
                                      {line.trim() ? (
                                        <div className="mb-2">{line.trim()}</div>
                                      ) : (
                                        <div className="mb-1"></div>
                                      )}
                                    </Fragment>
                                  ))
                                ) : (
                                  <div className="text-slate-400 italic">Click Twitter/X tab to generate...</div>
                                )}
                              </div>
                            </div>
                          </div>
                          {post.twitterContent && (
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-xs text-slate-500">
                                {post.twitterContent.length} / 280 characters
                              </div>
                              <div className={`text-xs font-medium ${
                                post.twitterContent.length > 280 ? 'text-red-600' : 
                                post.twitterContent.length > 260 ? 'text-amber-600' : 
                                'text-green-600'
                              }`}>
                                {post.twitterContent.length <= 280 ? '✓ Within limit' : '⚠ Over limit'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Instagram Preview */}
                      {getSelectedPlatform(post.id) === 'instagram' && (
                        <div>
                          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-md mx-auto">
                            {/* Instagram header */}
                            <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  Y
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm">yourhandle</div>
                                </div>
                              </div>
                              <div className="text-slate-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Image - show generated image or placeholder */}
                            <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50">
                              {regeneratingPosts.has(post.id) ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <div className="text-xs text-slate-500">Generating image...</div>
                                  </div>
                                </div>
                              ) : post.instagramImageUrl ? (
                                <img 
                                  src={post.instagramImageUrl} 
                                  alt="Instagram post image" 
                                  className="w-full h-full object-cover"
                                />
                              ) : post.instagramImagePrompt ? (
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                  <div className="text-center w-full">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/60 rounded-full mb-3 backdrop-blur-sm">
                                      <ImageIcon className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="text-xs text-slate-600 bg-white/80 backdrop-blur-sm rounded-lg p-3 max-h-32 overflow-y-auto">
                                      <div className="font-semibold mb-1 text-slate-700">Image Concept:</div>
                                      <div className="text-[10px] leading-relaxed italic">{post.instagramImagePrompt.substring(0, 150)}{post.instagramImagePrompt.length > 150 ? '...' : ''}</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <div className="text-xs text-slate-400">Image will be generated</div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Caption */}
                            <div className="p-3">
                              <div className="mb-1">
                                <span className="font-semibold text-slate-900 text-sm">yourhandle</span>
                                {' '}
                                <span 
                                  className="text-slate-900 leading-relaxed whitespace-pre-line text-[13px]"
                                  style={{ 
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    lineHeight: '1.5'
                                  }}
                                >
                                  {regeneratingPosts.has(post.id) ? (
                                    <span className="text-slate-400 italic">Generating Instagram caption...</span>
                                  ) : post.instagramContent ? (
                                    post.instagramContent.split('\n').map((line, i) => (
                                      <Fragment key={i}>
                                        {line.trim() ? (
                                          <span>{line.trim()}{i < post.instagramContent!.split('\n').length - 1 ? '\n' : ''}</span>
                                        ) : (
                                          <br />
                                        )}
                                      </Fragment>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic">Click to generate Instagram caption...</span>
                                  )}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">Just now</div>
                            </div>
                          </div>
                          {post.instagramContent && (
                            <div className="mt-2 text-xs text-slate-500 text-right max-w-md mx-auto">
                              {post.instagramContent.length} characters
                            </div>
                          )}
                          {post.instagramImagePrompt && (
                            <div className="mt-2 max-w-md mx-auto">
                              <details className="text-xs">
                                <summary className="text-slate-500 cursor-pointer hover:text-slate-700">View full image prompt</summary>
                                <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-slate-600 italic text-[11px] leading-relaxed">
                                  {post.instagramImagePrompt}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {entry && (
                        <details className="mt-3">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                            View original entry
                          </summary>
                          <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600 italic">
                            {entry.originalText}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                      {/* Status Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          {post.status === 'draft' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(post.id, 'ready');
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Mark as Ready
                            </button>
                          )}
                          {post.status === 'ready' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(post.id, 'posted');
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Mark as Posted</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(post.id, 'draft');
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                              >
                                Back to Draft
                              </button>
                            </>
                          )}
                          {post.status === 'posted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(post.id, 'archived');
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                            >
                              Archive
                            </button>
                          )}
                          {post.status === 'archived' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(post.id, 'draft');
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Updated {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(post.updatedAt)}
                        </div>
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

export default PostsView;

