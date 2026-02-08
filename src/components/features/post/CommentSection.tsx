"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, LogInIcon, Loader2Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createComment } from "@/actions/post.action";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  isAuthenticated: boolean;
  currentUserImage?: string | null;
}

/**
 * CommentSection Component
 *
 * Displays comments and handles comment creation
 */
export function CommentSection({
  postId,
  comments,
  isAuthenticated,
  currentUserImage,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const content = newComment.trim();
    setNewComment(""); // Clear immediately for better UX

    startTransition(async () => {
      try {
        const result = await createComment({ postId, content });

        if (result?.success) {
          toast.success("Comment posted!");
        } else {
          throw new Error(result?.error || "Failed to post comment");
        }
      } catch (error) {
        // Restore comment on error
        setNewComment(content);
        toast.error("Failed to post comment. Please try again.");
        console.error("Comment error:", error);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Display Comments */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Link href={`/profile/${comment.author.username ?? comment.author.id}`}>
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarImage
                    src={comment.author.image ?? "/avatar.png"}
                    alt={comment.author.name ?? "User"}
                  />
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={`/profile/${comment.author.username ?? comment.author.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {comment.author.name ?? comment.author.username ?? comment.author.id}
                  </Link>
                  <Link
                    href={`/profile/${comment.author.username ?? comment.author.id}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    @{comment.author.username ?? comment.author.id}
                  </Link>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt))} ago
                  </span>
                </div>
                <p className="text-sm break-words mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <div className="flex space-x-3">
          <Avatar className="size-8 flex-shrink-0">
            <AvatarImage src={currentUserImage || "/avatar.png"} alt="Your avatar" />
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Write a comment... (Ctrl+Enter to post)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              disabled={isPending}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleAddComment}
                className="flex items-center gap-2"
                disabled={!newComment.trim() || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
          <Button variant="outline" className="gap-2" onClick={() => signIn()}>
            <LogInIcon className="size-4" />
            Sign in to comment
          </Button>
        </div>
      )}
    </div>
  );
}
