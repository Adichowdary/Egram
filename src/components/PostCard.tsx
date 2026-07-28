import { useState, useEffect } from "react";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Share, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";
import { usePosts, Post } from "@/hooks/usePosts";

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
    avatarUrl?: string;
    text: string;
    timestamp: any;
}

interface PostCardProps {
    post: Post;
    user: any; // User type from Firebase
    getInitials: (name: string | null) => string;
    onDelete?: (postId: string) => void;
}

export function PostCard({ post: initialPost, user, getInitials, onDelete }: PostCardProps) {
    const [post, setPost] = useState(initialPost);
    const [isLiked, setIsLiked] = useState(initialPost.likes.includes(user.uid));
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
    const [newComment, setNewComment] = useState("");
    const [showBigHeart, setShowBigHeart] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    
    const { addToast } = useToast();
    const { toggleLike, addComment, fetchComments, deleteComment, deletePost, isSubmitting } = usePosts(user);

    useEffect(() => {
        setPost(initialPost);
        setIsLiked(initialPost.likes.includes(user.uid));
        if ((initialPost as any).initialComments && Array.isArray((initialPost as any).initialComments)) {
            setComments((initialPost as any).initialComments.map((c: any, idx: number) => ({
                id: c._id || `c-${Date.now()}-${idx}`,
                authorId: c.user,
                authorName: resolveAuthorName(c.userName, c.user),
                authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                avatarUrl: c.avatarUrl || "",
                text: c.text,
                timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
            })));
        }
    }, [initialPost, user.uid]);

    // Fetch comments whenever user opens the comment section
    useEffect(() => {
        if (showComments && post.id) {
            setIsLoadingComments(true);
            fetchComments(post.id).then((serverComments) => {
                if (Array.isArray(serverComments)) {
                    setComments(serverComments.map((c: any, idx: number) => ({
                        id: c._id || `c-${Date.now()}-${idx}`,
                        authorId: c.user,
                        authorName: resolveAuthorName(c.userName, c.user),
                        authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                        avatarUrl: c.avatarUrl || "",
                        text: c.text,
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
                    })));
                }
            }).finally(() => setIsLoadingComments(false));
        }
    }, [showComments, post.id]);

    // Optimistic Like
    const handleLike = async () => {
        const wasLiked = isLiked;
        const newLikes = wasLiked 
            ? post.likes.filter(id => id !== user.uid)
            : [...post.likes, user.uid];
        
        setIsLiked(!wasLiked);
        setPost(prev => ({ ...prev, likes: newLikes }));

        try {
            await toggleLike(post, wasLiked);
        } catch (error) {
            setIsLiked(wasLiked);
            setPost(prev => ({ ...prev, likes: wasLiked ? [...prev.likes, user.uid] : prev.likes.filter(id => id !== user.uid) }));
        }
    };

    const handleDoubleTap = () => {
        if (!isLiked) handleLike();
        setShowBigHeart(true);
        setTimeout(() => setShowBigHeart(false), 800);
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            addToast("Post link copied!", "success");
        } catch (err) {
            addToast("Failed to copy link", "error");
        }
    };

    const resolveAuthorName = (rawName: string | undefined | null, commentUserId: string) => {
        if (rawName && rawName !== "Student" && rawName !== "User") return rawName;
        if (commentUserId === user?.uid) return user?.displayName || user?.email?.split('@')[0] || "You";
        return "User";
    };

    const handleToggleCommentLike = (commentId: string) => {
        setCommentLikes(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const handleDeleteComment = async (commentId: string) => {
        // Optimistic UI removal
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPost(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }));

        try {
            const updatedComments = await deleteComment(post.id, commentId);
            if (Array.isArray(updatedComments)) {
                setComments(updatedComments.map((c: any, idx: number) => ({
                    id: c._id || `c-${Date.now()}-${idx}`,
                    authorId: c.user,
                    authorName: resolveAuthorName(c.userName, c.user),
                    authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                    avatarUrl: c.avatarUrl || "",
                    text: c.text,
                    timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
                })));
            }
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    // Optimistic Add Comment
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text || isSubmitting) return;

        const currentAuthorName = user.displayName || user.email?.split('@')[0] || "You";
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            authorId: user.uid,
            authorName: currentAuthorName,
            authorInitials: getInitials(currentAuthorName),
            avatarUrl: user.photoURL || "",
            text,
            timestamp: { toDate: () => new Date() }
        };

        setComments(prev => [optimisticComment, ...prev]);
        setNewComment("");
        setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));

        try {
            const serverComments = await addComment(post.id, text);
            if (Array.isArray(serverComments)) {
                setComments(serverComments.map((c: any, idx: number) => {
                    const resolvedName = resolveAuthorName(c.userName, c.user);
                    return {
                        id: c._id || `c-${Date.now()}-${idx}`,
                        authorId: c.user,
                        authorName: resolvedName,
                        authorInitials: getInitials(resolvedName),
                        avatarUrl: c.avatarUrl || "",
                        text: c.text,
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
                    };
                }));
            }
        } catch (error) {
            console.error("Comment post error:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post.id);
            if (onDelete) {
                onDelete(post.id);
            }
        } catch (error) {
            // Error handled in hook
        }
    };

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    return (
        <article className="ig-post glass">
            <div className="post-header">
                <div className="avatar-small">{post.authorInitials}</div>
                <div className="post-meta flex flex-col items-start gap-0">
                    <span className="author-name">{post.authorName}</span>
                    <span className="timestamp text-xs">
                        {post.timestamp?.toDate() ? getTimeAgo(post.timestamp) : "Just now"}
                    </span>
                </div>
                <div className="relative ml-auto">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2.5 rounded-full hover:bg-zinc-800/80 active:scale-95 transition-all text-zinc-400 hover:text-white flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-6 h-6" />
                    </button>
                    <AnimatePresence>
                        {showMenu && post.authorId === user.uid && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5"
                            >
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2.5 active:scale-98"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Post
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {post.mediaUrl && (
                <div className="post-media-container bg-zinc-950 relative overflow-hidden flex items-center justify-center cursor-pointer select-none" onDoubleClick={handleDoubleTap}>
                    {isImageLoading && (
                        <div className="absolute inset-0 animate-shimmer" />
                    )}
                    <img 
                        src={post.mediaUrl} 
                        alt="Post content" 
                        className={`post-image pointer-events-none transition-opacity duration-150 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} 
                        loading="lazy" 
                        onLoad={() => setIsImageLoading(false)}
                    />
                    
                    {/* Big Heart Animation Overlay */}
                    <AnimatePresence>
                        {showBigHeart && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                className="absolute pointer-events-none z-10"
                            >
                                <Heart className="w-24 h-24 text-white drop-shadow-2xl fill-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="post-actions">
                <div className="action-group">
                    <motion.button
                        whileTap={{ scale: 0.75 }}
                        onClick={handleLike}
                        className={`action-btn ${isLiked ? 'text-red-500' : ''}`}
                        aria-label={isLiked ? "Unlike post" : "Like post"}
                    >
                        <Heart fill={isLiked ? "currentColor" : "none"} className="w-6 h-6 transition-transform hover:scale-110" />
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowComments(!showComments)} 
                        className="action-btn"
                        aria-label="Toggle comments"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </motion.button>
                    <button className="action-btn" aria-label="Send post"><Send className="w-5 h-5" /></button>
                </div>
                <button onClick={handleShare} className="action-btn" aria-label="Share post"><Share className="w-5 h-5 transition-transform hover:-translate-y-1" /></button>
            </div>

            <div className="post-content">
                <p className="likes-count">{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</p>
                <p className="caption">
                    <span className="author-bold">{post.authorName}</span> {post.content}
                </p>
                {post.commentsCount && post.commentsCount > 0 && !showComments && (
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-zinc-500 text-sm font-medium mt-1 mb-2 hover:text-zinc-300 transition-colors"
                    >
                        View all {post.commentsCount} comments
                    </button>
                )}
            </div>

            {/* Instagram-Style Smooth Comments Drawer */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="border-t border-zinc-800/60 mt-2 overflow-hidden bg-zinc-950/40 rounded-b-2xl"
                    >
                        <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {isLoadingComments ? (
                                <div className="py-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span>Loading comments...</span>
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-zinc-500 text-center py-3">No comments yet. Be the first to start the conversation!</p>
                            ) : (
                                comments.map(comment => {
                                    const canDelete = comment.authorId === user.uid || post.authorId === user.uid;
                                    const isCommentLiked = !!commentLikes[comment.id];
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            key={comment.id} 
                                            className="flex items-start gap-2.5 text-sm group/comment"
                                        >
                                            {/* Avatar Badge */}
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 mt-0.5 shadow-md overflow-hidden">
                                                {comment.avatarUrl ? (
                                                    <img src={comment.avatarUrl} alt={comment.authorName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{comment.authorInitials || getInitials(comment.authorName)}</span>
                                                )}
                                            </div>

                                            {/* Text Content & Actions */}
                                            <div className="flex-1 min-w-0">
                                                <div className="leading-snug break-words">
                                                    <span className="font-bold text-white text-xs mr-2">{comment.authorName}</span>
                                                    <span className="text-zinc-300 text-xs">{comment.text}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500 font-medium">
                                                    <span>{getTimeAgo(comment.timestamp)}</span>
                                                    <button 
                                                        onClick={() => handleToggleCommentLike(comment.id)}
                                                        className={`hover:text-zinc-300 transition-colors ${isCommentLiked ? 'text-red-500 font-bold' : ''}`}
                                                    >
                                                        {isCommentLiked ? 'Liked' : 'Like'}
                                                    </button>
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-zinc-500 hover:text-red-400 opacity-80 hover:opacity-100 transition-all flex items-center gap-1 min-h-[32px] px-1"
                                                            title="Delete comment"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Heart button for comment */}
                                            <button 
                                                onClick={() => handleToggleCommentLike(comment.id)}
                                                className={`p-1.5 text-zinc-500 hover:text-red-500 transition-colors ${isCommentLiked ? 'text-red-500' : ''}`}
                                                aria-label="Like comment"
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${isCommentLiked ? 'fill-current' : ''}`} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Comment Form Bar */}
                        <form onSubmit={handleAddComment} className="flex items-center gap-2.5 px-4 py-3 border-t border-zinc-800/60 bg-zinc-900/60">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                                {getInitials(user.displayName || "You")}
                            </div>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                            />
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="text-primary font-bold text-xs disabled:opacity-40 px-2 py-1 transition-all"
                            >
                                {isSubmitting ? "..." : "Post"}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
