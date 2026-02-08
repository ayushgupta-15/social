/**
 * CreatePost - Backward compatibility wrapper
 *
 * Re-exports the modernized CreatePostForm component.
 * The new version uses react-hook-form + Zod for validation.
 */

export { CreatePostForm as default } from "./features/post/CreatePostForm";
export { CreatePostForm } from "./features/post/CreatePostForm";
