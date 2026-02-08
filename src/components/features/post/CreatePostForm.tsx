"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/actions/post.action";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/ImageUpload";
import { OptimizedImage } from "@/components/shared/OptimizedImage";
import {
  createPostSchema,
  type CreatePostInput,
  type CreatePostOutput,
} from "@/lib/validation/schemas/post.schema";

/**
 * CreatePostForm Component (Modernized with react-hook-form)
 *
 * Features:
 * - react-hook-form for form state management
 * - Zod validation with automatic error handling
 * - Type-safe form inputs
 * - Optimized re-renders
 * - Better UX with validation feedback
 */
export function CreatePostForm() {
  const { data: session } = useSession();
  const [showImageUpload, setShowImageUpload] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput, unknown, CreatePostOutput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
      image: "",
    },
  });

  const content = watch("content");
  const imageUrl = watch("image");
  const hasContent = content?.trim() || imageUrl;

  const onSubmit = async (data: CreatePostOutput) => {
    try {
      const result = await createPost(data);

      if (result?.success) {
        reset(); // Reset form to default values
        setShowImageUpload(false);
        toast.success("Post created successfully!");
      } else {
        toast.error(result?.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && hasContent) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const removeImage = () => {
    setValue("image", "", { shouldDirty: true });
    setShowImageUpload(false);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Post Input */}
          <div className="flex space-x-4">
            <Avatar className="size-10 flex-shrink-0">
              <AvatarImage
                src={session?.user?.image || "/avatar.png"}
                alt={session?.user?.name || "User"}
              />
            </Avatar>

            <div className="flex-1 space-y-2">
              <Textarea
                {...register("content")}
                placeholder="What's on your mind? (Ctrl+Enter to post)"
                className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                disabled={isSubmitting}
                onKeyDown={handleKeyDown}
                aria-label="Post content"
              />

              {/* Validation Error */}
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          {(showImageUpload || imageUrl) && (
            <div className="border rounded-lg p-4 relative">
              {imageUrl ? (
                <div className="relative">
                  <OptimizedImage
                    src={imageUrl}
                    alt="Post preview"
                    width={800}
                    height={600}
                    className="rounded-lg w-full max-h-96"
                    objectFit="cover"
                    sizes="(max-width: 640px) 100vw, 800px"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    disabled={isSubmitting}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <ImageUpload
                  endpoint="postImage"
                  value={imageUrl || ""}
                  onChange={(url) => {
                    setValue("image", url, { shouldDirty: true });
                    if (!url) setShowImageUpload(false);
                  }}
                />
              )}

              {/* Image URL Validation Error */}
              {errors.image && (
                <p className="text-sm text-destructive mt-2">{errors.image.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isSubmitting}
              >
                <ImageIcon className="size-4 mr-2" />
                {imageUrl ? "Change" : "Add"} Photo
              </Button>
            </div>

            {/* Character Count (optional) */}
            <div className="flex items-center gap-4">
              {content && (
                <span
                  className={`text-xs ${
                    content.length > 5000
                      ? "text-destructive"
                      : content.length > 4500
                        ? "text-yellow-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {content.length}/5000
                </span>
              )}

              <Button
                type="submit"
                disabled={!hasContent || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreatePostForm;
