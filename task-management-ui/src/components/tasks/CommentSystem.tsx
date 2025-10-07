import React, { useState, useRef } from 'react';
import { Comment, User } from '../../types';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { formatRelativeTime } from '../../utils';
import { 
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ReplyIcon,
} from '../icons';

interface CommentSystemProps {
  taskId: string;
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, parentId?: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUser: User;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  level = 0,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isOwner = comment.authorId === currentUser.id;
  const maxLevel = 3; // Maximum nesting level

  const handleMentionClick = (userId: string) => {
    // Handle user mention click - could navigate to user profile
    console.log('Mention clicked:', userId);
  };

  const renderContent = (content: string) => {
    // Simple mention parsing - in a real app, you'd use a more sophisticated parser
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 3 === 1) {
        // This is a mention name
        const userId = parts[index + 1];
        return (
          <button
            key={index}
            onClick={() => handleMentionClick(userId)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            @{part}
          </button>
        );
      } else if (index % 3 === 2) {
        // This is a mention ID, skip it
        return null;
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div
        className="group relative p-3 rounded-lg hover:bg-gray-50"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Comment Header */}
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={`${comment.author.firstName} ${comment.author.lastName}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {comment.author?.firstName[0]}{comment.author?.lastName[0]}
            </div>
          )}

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            
            <div className="mt-1 text-sm text-gray-700">
              {renderContent(comment.content)}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1">
              {level < maxLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="p-1 h-6 w-6"
                >
                  <ReplyIcon className="h-3 w-3" />
                </Button>
              )}
              
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(comment.id)}
                    className="p-1 h-6 w-6"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(comment.id)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSystem: React.FC<CommentSystemProps> = ({
  taskId,
  comments,
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  className = '',
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group comments by parent (top-level comments and their replies)
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);
  const commentReplies = comments.reduce((acc, comment) => {
    if (comment.parentCommentId) {
      if (!acc[comment.parentCommentId]) {
        acc[comment.parentCommentId] = [];
      }
      acc[comment.parentCommentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Add replies to their parent comments
  const commentsWithReplies = topLevelComments.map(comment => ({
    ...comment,
    replies: commentReplies[comment.id] || [],
  }));

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    onAddComment(newComment.trim(), replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingComment && editContent.trim()) {
      onUpdateComment(editingComment, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment List */}
      <div className="space-y-2">
        {commentsWithReplies.length > 0 ? (
          commentsWithReplies.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={onDeleteComment}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              Replying to comment
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comment Input */}
      <div className="border-t pt-4">
        <div className="flex space-x-3">
          {/* Current User Avatar */}
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>
          )}

          {/* Comment Form */}
          <div className="flex-1 space-y-3">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={setNewComment}
              onKeyDown={handleKeyPress}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              rows={3}
              className="resize-none"
            />
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Press Cmd+Enter to submit
              </p>
              
              <div className="flex items-center space-x-2">
                {replyingTo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>{replyingTo ? 'Reply' : 'Comment'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSystem;