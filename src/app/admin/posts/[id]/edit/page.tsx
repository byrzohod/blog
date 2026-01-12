'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { AutosaveIndicator } from '@/components/editor/autosave-indicator';
import { useAutosave } from '@/hooks/use-autosave';
import { updatePost, deletePost, getPostById } from '@/app/actions/posts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type PostForm = z.infer<typeof postSchema>;

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [content, setContent] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    reset,
    watch,
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
  });

  // Watch form values for autosave
  const watchedTitle = watch('title');
  const watchedExcerpt = watch('excerpt');
  const watchedFeaturedImage = watch('featuredImage');
  const watchedMetaTitle = watch('metaTitle');
  const watchedMetaDescription = watch('metaDescription');

  // Memoize autosave data to prevent unnecessary re-renders
  const autosaveData = useMemo(() => ({
    title: watchedTitle,
    content,
    excerpt: watchedExcerpt,
    featuredImage: watchedFeaturedImage,
    metaTitle: watchedMetaTitle,
    metaDescription: watchedMetaDescription,
  }), [watchedTitle, content, watchedExcerpt, watchedFeaturedImage, watchedMetaTitle, watchedMetaDescription]);

  // Auto-save functionality
  const { status: autosaveStatus, lastSavedAt, error: autosaveError } = useAutosave({
    postId: postId || null,
    data: autosaveData,
    enabled: !isFetching && !!postId,
    debounceMs: 30000, // 30 seconds
  });

  useEffect(() => {
    async function loadPost() {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);

      const result = await getPostById(resolvedParams.id);

      if (result.error || !result.post) {
        router.push('/admin/posts');
        return;
      }

      const post = result.post;
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        featuredImage: post.featuredImage || '',
        categoryId: post.categoryId || '',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
      });
      setContent(post.content);
      setCurrentStatus(post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED');
      setIsFetching(false);
    }

    loadPost();
  }, [params, reset, router]);

  const onSubmit = async (data: PostForm, status: 'DRAFT' | 'PUBLISHED') => {
    setIsLoading(true);

    const result = await updatePost(postId, {
      ...data,
      content,
      status,
    });

    if (result.error) {
      setError('root', { message: result.error });
      setIsLoading(false);
      return;
    }

    setCurrentStatus(status);
    setIsLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deletePost(postId);

    if (result.error) {
      setError('root', { message: result.error });
      setIsLoading(false);
      setShowDeleteDialog(false);
      return;
    }

    router.push('/admin/posts');
    router.refresh();
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Post</h1>
            <div className="flex items-center gap-4">
              <p className="text-foreground-muted">
                Status: <span className="capitalize">{currentStatus.toLowerCase()}</span>
              </p>
              <AutosaveIndicator
                status={autosaveStatus}
                lastSavedAt={lastSavedAt}
                error={autosaveError}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-error hover:text-error"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={handleSubmit((data) => onSubmit(data, 'DRAFT'))}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit((data) => onSubmit(data, 'PUBLISHED'))}
            disabled={isLoading}
          >
            <Send className="h-4 w-4 mr-2" />
            {currentStatus === 'PUBLISHED' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {errors.root && (
        <div className="p-3 rounded-md bg-error/10 text-error text-sm">
          {errors.root.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-error">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="post-url-slug"
                  {...register('slug')}
                />
                {errors.slug && (
                  <p className="text-sm text-error">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the post"
                  rows={3}
                  {...register('excerpt')}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your post..."
                />
                {errors.content && (
                  <p className="text-sm text-error">{errors.content.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Image URL</Label>
                <Input
                  id="featuredImage"
                  placeholder="https://..."
                  {...register('featuredImage')}
                />
                <p className="text-xs text-foreground-muted">
                  Enter an image URL or upload via Media Library
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title (optional)"
                  {...register('metaTitle')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description (optional)"
                  rows={3}
                  {...register('metaDescription')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
