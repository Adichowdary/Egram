import { useState, useEffect } from "react";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";
import { usePosts, Post } from "@/hooks/usePosts";

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
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
    const [newComment, setNewComment] = useState("");
    const [showBigHeart, setShowBigHeart] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    
    const { addToast } = useToast();
    const { toggleLike, addComment, deletePost, isSubmitting } = usePosts(user);

    useEffect(() => {
        setPost(initialPost);
        setIsLiked(initialPost.likes.includes(user.uid));
    }, [initialPost, user.uid]);

    // Optimistic Like
    const handleLike = async () => {
        const wasLiked = isLiked;
        const newLikes = wasLiked 
            ? post.likes.filter(id => id !== user.uid)
            : [...post.likes, user.uid];
        
        // Update UI immediately
        setIsLiked(!wasLiked);
        setPost(prev => ({ ...prev, likes: newLikes }));

        try {
            await toggleLike(post, wasLiked);
        } catch (error) {
            // Revert on failure
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

    // Optimistic Comment
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text || isSubmitting) return;

        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            authorId: user.uid,
            authorName: user.displayName || "You",
            authorInitials: getInitials(user.displayName),
            text,
            timestamp: { toDate: () => new Date() }
        };

        // Update UI immediately
        setComments(prev => [optimisticComment, ...prev]);
        setNewComment("");
        setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));

        try {
            const serverComments = await addComment(post.id, text);
            // Sync with server if needed or just leave the optimistic one until next refresh
            // But usually we map server response back to ensure proper IDs
            setComments(serverComments.map((c: any) => ({
                id: c._id,
                authorId: c.user,
                authorName: c.userName || "User",
                authorInitials: getInitials(c.userName),
                text: c.text,
                timestamp: { toDate: () => new Date(c.createdAt) }
            })));
        } catch (error) {
            // Revert on failure
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 1) - 1 }));
            setNewComment(text); // restore text
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post.id);
            if (onDelete) {
                onDelete(post.id);
            }
        } catch (error) {
            // Error handling is in the hook
        }
    };

    return (
        <article className="ig-post glass">
            <div className="post-header">
                <div className="avatar-small">{post.authorInitials}</div>
                <div className="post-meta flex flex-col items-start gap-0">
                    <span className="author-name">{post.authorName}</span>
                    <span className="timestamp text-xs">
                        {post.timestamp?.toDate() ? new Date(post.timestamp.toDate()).toLocaleDateString() : "Just now"}
                    </span>
                </div>
                <div className="relative ml-auto">
                    <MoreHorizontal 
                        className="cursor-pointer" 
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="More options" 
                    />
                    <AnimatePresence>
                        {showMenu && post.authorId === user.uid && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                            >
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-zinc-800/50 transition-colors"
                                >
                                    Delete Post
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
                        whileTap={{ scale: 0.8 }}
                        onClick={handleLike}
                        className={`action-btn ${isLiked ? 'text-red-500' : ''}`}
                        aria-label={isLiked ? "Unlike post" : "Like post"}
                    >
                        <Heart fill={isLiked ? "currentColor" : "none"} />
                    </motion.button>
                    <button 
                        onClick={() => setShowComments(!showComments)} 
                        className="action-btn"
                        aria-label="Toggle comments"
                    >
                        <MessageCircle />
                    </button>
                    <button className="action-btn" aria-label="Send post"><Send /></button>
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
                        className="text-zinc-500 text-sm mt-1 mb-2 hover:text-zinc-400"
                    >
                        View all {post.commentsCount} comments
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-800/50 mt-2 overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {comments.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-2">No comments yet. Start the conversation!</p>
                            ) : (
                                comments.map(comment => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={comment.id} 
                                        className="flex gap-2 text-sm"
                                    >
                                        <span className="font-semibold">{comment.authorName}</span>
                                        <span className="text-zinc-300 break-words flex-1">{comment.text}</span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleAddComment} className="flex items-center px-4 py-3 border-t border-zinc-800/50">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-500"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="text-primary font-semibold text-sm disabled:opacity-50 ml-2"
                            >
                                {isSubmitting ? "..." : "Post"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
