import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentSystem from '../CommentSystem';
import { Comment, User } from '../../../types';

const mockCurrentUser: User = {
  id: 'user-1',
  email: 'current@example.com',
  firstName: 'Current',
  lastName: 'User',
  role: 'USER' as any,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOtherUser: User = {
  id: 'user-2',
  email: 'other@example.com',
  firstName: 'Other',
  lastName: 'User',
  role: 'USER' as any,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'This is a test comment',
    taskId: 'task-1',
    authorId: 'user-1',
    author: mockCurrentUser,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'comment-2',
    content: 'This is another comment with @[Current User](user-1) mention',
    taskId: 'task-1',
    authorId: 'user-2',
    author: mockOtherUser,
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T11:00:00Z',
  },
  {
    id: 'comment-3',
    content: 'This is a reply',
    taskId: 'task-1',
    authorId: 'user-1',
    author: mockCurrentUser,
    parentCommentId: 'comment-1',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
];

describe('CommentSystem', () => {
  const defaultProps = {
    taskId: 'task-1',
    comments: mockComments,
    currentUser: mockCurrentUser,
    onAddComment: vi.fn(),
    onUpdateComment: vi.fn(),
    onDeleteComment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comment system with correct count', () => {
    render(<CommentSystem {...defaultProps} />);

    expect(screen.getByText('Comments (3)')).toBeInTheDocument();
  });

  it('displays all top-level comments', () => {
    render(<CommentSystem {...defaultProps} />);

    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText(/This is another comment with/)).toBeInTheDocument();
  });

  it('displays replies nested under parent comments', () => {
    render(<CommentSystem {...defaultProps} />);

    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  it('shows empty state when no comments', () => {
    render(<CommentSystem {...defaultProps} comments={[]} />);

    expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
  });

  it('allows adding new comment', async () => {
    const user = userEvent.setup();
    const mockOnAddComment = vi.fn();
    
    render(<CommentSystem {...defaultProps} onAddComment={mockOnAddComment} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitButton = screen.getByText('Comment');

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    expect(mockOnAddComment).toHaveBeenCalledWith('New test comment', undefined);
  });

  it('submits comment with Cmd+Enter', async () => {
    const user = userEvent.setup();
    const mockOnAddComment = vi.fn();
    
    render(<CommentSystem {...defaultProps} onAddComment={mockOnAddComment} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    await user.type(textarea, 'New test comment');
    await user.keyboard('{Meta>}{Enter}{/Meta}');

    expect(mockOnAddComment).toHaveBeenCalledWith('New test comment', undefined);
  });

  it('does not submit empty comment', async () => {
    const user = userEvent.setup();
    const mockOnAddComment = vi.fn();
    
    render(<CommentSystem {...defaultProps} onAddComment={mockOnAddComment} />);

    const submitButton = screen.getByText('Comment');
    await user.click(submitButton);

    expect(mockOnAddComment).not.toHaveBeenCalled();
  });

  it('shows reply interface when reply button is clicked', async () => {
    const user = userEvent.setup();
    render(<CommentSystem {...defaultProps} />);

    // Hover over comment to show actions
    const comment = screen.getByText('This is a test comment').closest('div');
    await user.hover(comment!);

    const replyButton = screen.getByRole('button', { name: /reply/i });
    await user.click(replyButton);

    expect(screen.getByText('Replying to comment')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
  });

  it('allows replying to comments', async () => {
    const user = userEvent.setup();
    const mockOnAddComment = vi.fn();
    
    render(<CommentSystem {...defaultProps} onAddComment={mockOnAddComment} />);

    // Start reply
    const comment = screen.getByText('This is a test comment').closest('div');
    await user.hover(comment!);
    
    const replyButton = screen.getByRole('button', { name: /reply/i });
    await user.click(replyButton);

    // Type reply
    const textarea = screen.getByPlaceholderText('Write a reply...');
    await user.type(textarea, 'This is a reply');

    // Submit reply
    const submitButton = screen.getByText('Reply');
    await user.click(submitButton);

    expect(mockOnAddComment).toHaveBeenCalledWith('This is a reply', 'comment-1');
  });

  it('cancels reply when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CommentSystem {...defaultProps} />);

    // Start reply
    const comment = screen.getByText('This is a test comment').closest('div');
    await user.hover(comment!);
    
    const replyButton = screen.getByRole('button', { name: /reply/i });
    await user.click(replyButton);

    // Cancel reply
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByText('Replying to comment')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for own comments', async () => {
    const user = userEvent.setup();
    render(<CommentSystem {...defaultProps} />);

    const ownComment = screen.getByText('This is a test comment').closest('div');
    await user.hover(ownComment!);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not show edit and delete buttons for other users comments', async () => {
    const user = userEvent.setup();
    render(<CommentSystem {...defaultProps} />);

    const otherComment = screen.getByText(/This is another comment with/).closest('div');
    await user.hover(otherComment!);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('calls onDeleteComment when delete is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDeleteComment = vi.fn();
    
    render(<CommentSystem {...defaultProps} onDeleteComment={mockOnDeleteComment} />);

    const ownComment = screen.getByText('This is a test comment').closest('div');
    await user.hover(ownComment!);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDeleteComment).toHaveBeenCalledWith('comment-1');
  });

  it('renders user mentions as clickable links', () => {
    render(<CommentSystem {...defaultProps} />);

    const mentionButton = screen.getByRole('button', { name: '@Current User' });
    expect(mentionButton).toBeInTheDocument();
    expect(mentionButton).toHaveClass('text-blue-600');
  });

  it('shows edited indicator for edited comments', () => {
    const editedComments = [
      {
        ...mockComments[0],
        updatedAt: '2024-01-01T15:00:00Z', // Different from createdAt
      },
    ];

    render(<CommentSystem {...defaultProps} comments={editedComments} />);

    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('displays user avatars correctly', () => {
    const commentsWithAvatars = [
      {
        ...mockComments[0],
        author: {
          ...mockCurrentUser,
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    ];

    render(<CommentSystem {...defaultProps} comments={commentsWithAvatars} />);

    const avatar = screen.getByAltText('Current User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('displays user initials when no avatar', () => {
    render(<CommentSystem {...defaultProps} />);

    expect(screen.getByText('CU')).toBeInTheDocument(); // Current User initials
    expect(screen.getByText('OU')).toBeInTheDocument(); // Other User initials
  });

  it('limits reply nesting to maximum level', async () => {
    const user = userEvent.setup();
    
    // Create deeply nested comments
    const deeplyNestedComments = [
      mockComments[0],
      { ...mockComments[2], parentCommentId: 'comment-1' }, // Level 1
      { ...mockComments[2], id: 'comment-4', parentCommentId: 'comment-3' }, // Level 2
      { ...mockComments[2], id: 'comment-5', parentCommentId: 'comment-4' }, // Level 3
    ];

    render(<CommentSystem {...defaultProps} comments={deeplyNestedComments} />);

    // At max nesting level, reply button should not be shown
    const deepComment = screen.getAllByText('This is a reply')[2].closest('div');
    await user.hover(deepComment!);

    // Should not show reply button at max nesting level
    expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
  });
});