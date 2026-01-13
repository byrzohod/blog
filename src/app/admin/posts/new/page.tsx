'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { ImageUpload } from '@/components/editor/image-upload';
import { MediaPickerDialog } from '@/components/editor/media-picker-dialog';
import { createPost } from '@/app/actions/posts';
import { generateSlug } from '@/lib/utils';

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

export default function NewPostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | undefined>();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  const title = watch('title');

  const handleTitleBlur = () => {
    if (title && !watch('slug')) {
      setValue('slug', generateSlug(title));
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setValue('content', newContent, { shouldValidate: true });
  };

  const onSubmit = async (data: PostForm, status: 'DRAFT' | 'PUBLISHED') => {
    setIsLoading(true);

    const result = await createPost({
      ...data,
      content,
      featuredImage,
      status,
    });

    if (result.error) {
      setError('root', { message: result.error });
      setIsLoading(false);
      return;
    }

    router.push('/admin/posts');
    router.refresh();
  };

  const handleMediaSelect = (url: string) => {
    setFeaturedImage(url);
  };

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
            <h1 className="text-3xl font-bold">New Post</h1>
            <p className="text-foreground-muted">Create a new blog post</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            Publish
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
                  onBlur={handleTitleBlur}
                />
                {errors.title && (
                  <p className="text-sm text-error">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug
                  <span className="ml-2 text-xs text-foreground-muted font-normal">
                    (URL-friendly version of title, e.g., my-first-post)
                  </span>
                </Label>
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
                  onChange={handleContentChange}
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
              <ImageUpload
                value={featuredImage}
                onChange={setFeaturedImage}
                onOpenMediaLibrary={() => setMediaPickerOpen(true)}
              />
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

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
