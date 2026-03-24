import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Plus, Trash2, X, Image } from 'lucide-react';
import { barApi } from '../api/barApi';
import { eventApi } from '../api/eventApi';
import { getUploadUrl } from '../api/apiClient';
import useAuthStore from '../stores/authStore';
import { format } from 'date-fns';
import { parseUTC } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const Social = () => {
  const [followers, setFollowers] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({ post_comments: [], event_comments: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('followers');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const { user } = useAuthStore();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null, extra: null });
  const [commentsError, setCommentsError] = useState('');

  useEffect(() => { load(); }, []);

  const toArray = (value, keys = []) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }
    return [];
  };

  const handleDeletePost = (postId) => {
    setConfirmModal({ isOpen: true, type: 'post', id: postId, extra: null });
  };

  const executeDeletePost = async (postId) => {
    try {
      await barApi.deletePost(postId);
      toast.success('Post deleted');
      load();
    } catch {}
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setCreatingPost(true);
    try {
      await barApi.createPost({ bar_id: user?.bar_id, content: newPost.trim() }, postImageFile || null);
      toast.success('Post created');
      setNewPost('');
      setPostImageFile(null); setPostImagePreview(null);
      setShowPostModal(false);
      load();
    } catch {
      toast.error('Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  const formatAction = (action) => {
    const map = {
      CREATE_POST: 'created a post',
      DELETE_POST: 'deleted a post',
      CREATE_COMMENT: 'commented',
      DELETE_COMMENT: 'removed a comment',
      LIKE_EVENT: 'liked an event',
      UNLIKE_EVENT: 'unliked an event',
      FOLLOW_BAR: 'started following',
      UNFOLLOW_BAR: 'unfollowed',
      CREATE_REVIEW: 'left a review',
      UPDATE_REVIEW: 'updated a review',
      DELETE_REVIEW: 'removed a review',
    };
    return map[action] || action?.toLowerCase()?.replace(/_/g, ' ') || 'acted';
  };

  const safeFormat = (dateValue, pattern) => {
    if (!dateValue) return '—';
    const date = parseUTC(dateValue);
    if (!date || Number.isNaN(date.getTime())) return '—';
    return format(date, pattern);
  };

  const load = async () => {
    setCommentsError('');
    try {
      const [fRes, pRes] = await Promise.allSettled([
        barApi.getFollowers(),
        barApi.getPosts(),
      ]);

      // Temporarily load event comments via eventApi as a workaround
      let eventComments = [];
      try {
        const { data: evList } = await eventApi.list();
        const events = Array.isArray(evList?.data || evList) ? (evList?.data || evList) : [];
        const detailResults = await Promise.allSettled(
          events.map((ev) => eventApi.getDetails(ev.id))
        );
        for (const result of detailResults) {
          if (result.status === 'fulfilled') {
            const payload = result.value.data?.data || result.value.data;
            const evComments = Array.isArray(payload?.comments) ? payload.comments : [];
            const eventData = payload?.event || payload;
            // Enrich each comment with event title and date for context
            const enriched = evComments.map((c) => ({
              ...c,
              event_title: eventData?.title || 'Unknown Event',
              event_date: eventData?.event_date || null,
              event_id: eventData?.id || c.event_id,
            }));
            eventComments.push(...enriched);
          }
        }
      } catch {
        eventComments = [];
      }

      const cRes = { status: 'fulfilled', value: { data: { data: { event_comments: eventComments, post_comments: [] } } } };
      if (fRes.status === 'fulfilled') {
        const payload = fRes.value.data?.data || fRes.value.data;
        setFollowerCount(Number(payload?.follower_count || 0));
        setFollowers(toArray(payload, ['recent_followers', 'followers', 'data', 'items']));
      } else {
        setFollowerCount(0);
        setFollowers([]);
      }

      if (pRes.status === 'fulfilled') {
        const payload = pRes.value.data?.data || pRes.value.data;
        setPosts(toArray(payload, ['posts', 'data', 'items']));
      } else {
        setPosts([]);
      }

      if (cRes.status === 'fulfilled') {
        const payload = cRes.value.data?.data || cRes.value.data || {};
        setComments({
          post_comments: toArray(payload, ['post_comments']),
          event_comments: toArray(payload, ['event_comments']),
        });
      } else {
        setComments({ post_comments: [], event_comments: [] });
        const msg = cRes.reason?.response?.data?.message || cRes.reason?.message || 'Failed to load comments';
        setCommentsError(msg);
      }

      if (fRes.status === 'rejected' && pRes.status === 'rejected' && cRes.status === 'rejected') {
        setLoadError('Social data is unavailable right now.');
      } else {
        setLoadError('');
      }
    } catch {} finally { setLoading(false); }
  };

  const handleDeleteComment = (type, commentId) => {
    setConfirmModal({ isOpen: true, type: 'comment', id: commentId, extra: type });
  };

  const executeDeleteComment = async (type, commentId) => {
    try {
      await barApi.deleteComment(type, commentId);
      toast.success('Comment deleted');
      load();
    } catch {}
  };

  const executeConfirm = async () => {
    const { type, id, extra } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, id: null, extra: null });
    if (type === 'post') await executeDeletePost(id);
    else if (type === 'comment') await executeDeleteComment(extra, id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="card py-3" style={{ background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.2)' }}>
          <p className="text-sm" style={{ color: '#ff6666' }}>{loadError}</p>
        </div>
      )}

      <div className="flex gap-1 rounded-lg p-1 w-fit" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setTab('followers')} className="px-4 py-2 rounded-md text-sm font-medium transition-colors" style={tab === 'followers' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>
          Followers ({followerCount})
        </button>
        <button onClick={() => setTab('posts')} className="px-4 py-2 rounded-md text-sm font-medium transition-colors" style={tab === 'posts' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>
          Posts ({posts.length})
        </button>
        <button onClick={() => setTab('comments')} className="px-4 py-2 rounded-md text-sm font-medium transition-colors" style={tab === 'comments' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>
          Comments ({comments.post_comments.length + comments.event_comments.length})
        </button>
      </div>

      {tab === 'followers' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
                <th className="table-header">User</th>
                <th className="table-header">Email</th>
                <th className="table-header">Followed Since</th>
              </tr></thead>
              <tbody>
                {followers.map((f, i) => (
                  <tr key={f.id || i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(204,0,0,0.12)', color: '#CC0000' }}>
                          {f.first_name?.[0]}{f.last_name?.[0]}
                        </div>
                        <span className="font-medium text-white">{f.first_name} {f.last_name}</span>
                      </div>
                    </td>
                    <td className="table-cell" style={{ color: '#888' }}>{f.email || '—'}</td>
                    <td className="table-cell">{safeFormat(f.followed_at || f.created_at, 'MMM d, yyyy')}</td>
                  </tr>
                ))}
                {followers.length === 0 && <tr><td colSpan="3" className="text-center py-8" style={{ color: '#555' }}>No followers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowPostModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-4">
                {p.image_path && (
                  <img src={getUploadUrl(p.image_path)} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#ccc' }}>{p.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#666' }}>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.like_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {p.comment_count || 0}</span>
                    <span>{safeFormat(p.created_at, 'MMM d, yyyy h:mm a')}</span>
                    <span className={p.status === 'active' ? 'badge-success' : 'badge-gray'}>{p.status}</span>
                    <button onClick={() => handleDeletePost(p.id)} className="p-1 rounded transition-colors" style={{ color: '#ff6666' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="card text-center py-12" style={{ color: '#555' }}>No posts yet.</div>}
        </div>
      )}

      {tab === 'comments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {commentsError && (
            <div className="col-span-full card py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-sm" style={{ color: '#fbbf24' }}>{commentsError}</p>
            </div>
          )}
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Post Comments</h4>
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {comments.post_comments.map((c) => (
                <div key={`p-${c.id}`} className="rounded-lg p-3" style={{ background: '#161616' }}>
                  <p className="text-sm" style={{ color: '#ccc' }}>{c.comment}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: '#555' }}>{c.first_name} {c.last_name}</span>
                    <button onClick={() => handleDeleteComment('posts', c.id)} className="transition-colors" style={{ color: '#ff6666' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {comments.post_comments.length === 0 && !commentsError && <p className="text-sm" style={{ color: '#555' }}>No post comments.</p>}
            </div>
          </div>

          <div className="card">
            <h4 className="font-semibold text-white mb-3">Event Comments</h4>
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {comments.event_comments.map((c) => (
                <div key={`e-${c.id}`} className="rounded-lg p-3" style={{ background: '#161616' }}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: '#CC0000' }}>{c.event_title}</span>
                    <button onClick={() => handleDeleteComment('events', c.id)} className="transition-colors" style={{ color: '#ff6666' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm mb-2" style={{ color: '#ccc' }}>{c.comment}</p>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#555' }}>
                    <span>{c.first_name} {c.last_name}</span>
                    <span>{safeFormat(c.created_at, 'MMM d, h:mm a')}</span>
                  </div>
                  {c.event_date && (
                    <div className="text-xs mt-1" style={{ color: '#555' }}>
                      Event: {safeFormat(c.event_date, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              ))}
              {comments.event_comments.length === 0 && !commentsError && <p className="text-sm" style={{ color: '#555' }}>No event comments.</p>}
            </div>
          </div>
        </div>
      )}

      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowPostModal(false); setPostImageFile(null); setPostImagePreview(null); }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="font-bold text-white">Create New Post</h4>
              <button onClick={() => { setShowPostModal(false); setPostImageFile(null); setPostImagePreview(null); }} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="label">Content</label>
                <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} className="input-field h-28 resize-none" placeholder="Share updates with your followers..." required />
              </div>
              {postImagePreview && (
                <div className="relative">
                  <img src={postImagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-lg" />
                  <button type="button" onClick={() => { setPostImageFile(null); setPostImagePreview(null); }} className="absolute top-1 right-1 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.7)' }}><X className="w-3 h-3 text-white" /></button>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#888' }}>
                <Image className="w-4 h-4" />
                <span>Add photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files[0]; if (!file) return;
                  setPostImageFile(file);
                  setPostImagePreview(URL.createObjectURL(file));
                  e.target.value = '';
                }} />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowPostModal(false); setPostImageFile(null); setPostImagePreview(null); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creatingPost} className="btn-primary flex-1">{creatingPost ? 'Posting...' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, id: null, extra: null })}
        onConfirm={executeConfirm}
        title={confirmModal.type === 'post' ? 'Delete Post?' : 'Delete Comment?'}
        message={confirmModal.type === 'post'
          ? 'This post will be permanently deleted along with all its comments and reactions.'
          : 'This comment will be permanently deleted.'}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Social;
