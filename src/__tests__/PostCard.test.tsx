import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostCard } from '../components/PostCard';
import { ToastProvider } from '../components/ToastProvider';

// Mock values
const mockUser = {
  uid: 'user123',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
} as any;

const mockPost = {
  id: 'post123',
  authorId: 'author123',
  authorName: 'Author Name',
  authorInitials: 'AN',
  content: 'Hello World',
  mediaUrl: 'https://example.com/media.jpg',
  timestamp: { toDate: () => new Date() },
  likes: [],
};

const getInitials = (name: string | null) => 'AN';

// Mock fetch
global.fetch = jest.fn();

describe('PostCard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render post content correctly', () => {
        render(
            <ToastProvider>
                <PostCard post={mockPost} user={mockUser} getInitials={getInitials} />
            </ToastProvider>
        );

        expect(screen.getAllByText('Author Name')[0]).toBeInTheDocument();
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByAltText('Post content')).toHaveAttribute('src', mockPost.mediaUrl);
    });

    it('should call like API when heart is clicked', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ likes: [mockUser.uid] }),
        });

        render(
            <ToastProvider>
                <PostCard post={mockPost} user={mockUser} getInitials={getInitials} />
            </ToastProvider>
        );

        const likeButton = screen.getByRole('button', { name: /like post/i });
        fireEvent.click(likeButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `/api/posts/${mockPost.id}/like`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ userId: mockUser.uid }),
                })
            );
        });
    });

    it('should toggle comment section', async () => {
        render(
            <ToastProvider>
                <PostCard post={mockPost} user={mockUser} getInitials={getInitials} />
            </ToastProvider>
        );

        const commentButton = screen.getByRole('button', { name: /toggle comments/i });
        fireEvent.click(commentButton);

        // Check if "Add a comment..." input appears
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    });
});
