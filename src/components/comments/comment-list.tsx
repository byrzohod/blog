'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Reply, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentForm } from './comment-form';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  replies?: Comment[];
}

interface CommentListProps {
  postId: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

function CommentItem({
  comment,
  postId,
  onReply,
  onDelete,
  currentUserId,
  isAdmin,
}: {
  comment: Comment;
  postId: string;
  onReply: () => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const canDelete = isAdmin || comment.author.id === currentUserId;

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.image || undefined} alt={comment.author.name || ''} />
        <AvatarFallback>
          {comment.author.name?.charAt(0).toUpperCase() || 'A'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.author.name}</span>
          <span className="text-xs text-foreground-muted">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground-muted mb-2">{comment.content}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-error hover:text-error"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>

        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder="Write a reply..."
              onSuccess={() => {
                setShowReplyForm(false);
                onReply();
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                onReply={onReply}
                onDelete={onDelete}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentList({ postId, comments, onCommentAdded }: CommentListProps) {
  const { data: session } = useSession();
  const [localComments, setLocalComments] = useState(comments);

  const currentUserId = session?.user?.id;
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocalComments((prev) =>
          prev.filter((c) => c.id !== commentId)
        );
      }
    } catch {
      // Handle error silently
    }
  };

  const handleReply = () => {
    onCommentAdded?.();
  };

  if (localComments.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-muted">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {localComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          onReply={handleReply}
          onDelete={handleDelete}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
