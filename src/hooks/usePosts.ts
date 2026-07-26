import { useState } from 'react';
import { User } from 'firebase/auth';
import { useToast } from '@/components/ToastProvider';

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
    content: string;
    mediaUrl?: string;
    timestamp: any;
    likes: string[];
    commentsCount?: number;
}

export function usePosts(user: User) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleLike = async (post: Post, isLiked: boolean) => {
        // Optimistic update logic would be handled in the component state, 
        // but we can provide the API call here.
        try {
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid })
            });
            if (!res.ok) throw new Error("Failed to toggle like");
            return await res.json();
        } catch (error) {
            addToast("Failed to update like", "error");
            throw error;
        }
    };

    const addComment = async (postId: string, text: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid, text })
            });

            if (!res.ok) throw new Error("Failed to add comment");
            
            const data = await res.json();
            addToast("Comment posted!", "success");
            return data.comments;
        } catch (error) {
            addToast("Failed to post comment", "error");
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deletePost = async (postId: string) => {
        try {
            const res = await fetch(`/api/posts/${postId}?userId=${user.uid}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete post");
            addToast("Post deleted successfully", "success");
            return true;
        } catch (error) {
            addToast("Failed to delete post", "error");
            throw error;
        }
    };

    return {
        toggleLike,
        addComment,
        deletePost,
        isSubmitting
    };
}
