import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { PostSkeleton } from "./Skeletons";
import { PostCard } from "./PostCard";
import { Post } from "@/hooks/usePosts";
import { Sparkles, Users } from "lucide-react";

let globalFeedCache: Post[] | null = null;
let followingFeedCache: Post[] | null = null;

export function PostFeed({ user, feedType = "global" }: { user: User, feedType?: "global" | "following" }) {
    const initialCache = feedType === "following" ? followingFeedCache : globalFeedCache;
    const [posts, setPosts] = useState<Post[]>(initialCache || []);
    const [loading, setLoading] = useState(!initialCache);
    const [followingIds, setFollowingIds] = useState<string[]>([]);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    useEffect(() => {
        if (feedType === "following") {
            const q = query(collection(db, "follows"), where("followerId", "==", user.uid));
            onSnapshot(q, (snapshot) => {
                const ids = snapshot.docs.map(doc => doc.data().followingId);
                setFollowingIds(ids);
            });
        }
    }, [feedType, user.uid]);

    useEffect(() => {
        const currentCache = feedType === "following" ? followingFeedCache : globalFeedCache;
        if (!currentCache) {
            setLoading(true);
        }

        const fetchPosts = async (silent = false) => {
            try {
                const url = feedType === "following"
                    ? `/api/posts?type=following&userId=${user.uid}`
                    : `/api/posts`;

                const res = await fetch(url);
                if (res.ok) {
                    const result = await res.json();
                    const formattedPosts = result.data.map((p: any) => ({
                        id: p._id,
                        authorId: p.author?.firebaseUid || p.author,
                        authorName: p.author?.name || "Anonymous",
                        authorInitials: getInitials(p.author?.name),
                        content: p.content,
                        mediaUrl: p.images?.[0],
                        timestamp: { toDate: () => new Date(p.createdAt) },
                        likes: p.likes || [],
                        commentsCount: p.comments?.length || 0,
                        initialComments: p.comments || []
                    }));

                    if (feedType === "following") {
                        followingFeedCache = formattedPosts;
                    } else {
                        globalFeedCache = formattedPosts;
                    }

                    setPosts(formattedPosts);
                }
            } catch (error) {
                console.error("Feed fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts(!!currentCache);

        const handleNewPost = () => fetchPosts(true);
        window.addEventListener("postCreated", handleNewPost);
        return () => window.removeEventListener("postCreated", handleNewPost);
    }, [feedType, user.uid]);

    if (loading) {
        return (
            <div className="space-y-5">
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="glass-card p-10 text-center border border-dashed border-[var(--card-border)] rounded-3xl space-y-3">
                {feedType === "following" ? (
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-500 opacity-60" />
                        <p className="font-extrabold text-sm text-[var(--text-dark)]">Your following feed is empty</p>
                        <p className="text-xs text-[var(--text-light)] max-w-xs">Follow fellow students and creators to discover their daily posts here!</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-8 h-8 text-amber-500 opacity-60" />
                        <p className="font-extrabold text-sm text-[var(--text-dark)]">No posts shared yet</p>
                        <p className="text-xs text-[var(--text-light)]">Be the first to share a post or learning update with the community!</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    getInitials={getInitials}
                    onDelete={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
                />
            ))}
        </div>
    );
}
