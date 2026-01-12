'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data.tags || []);
    } catch {
      setError('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingTag ? formData.slug : generateSlug(name),
    });
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormData({ name: '', slug: '' });
    setError('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
    });
    setError('');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setDeletingTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
      const method = editingTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save tag');
        return;
      }

      await fetchTags();
      setIsDialogOpen(false);
    } catch {
      setError('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tags/${deletingTag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete tag');
        return;
      }

      await fetchTags();
      setIsDeleteDialogOpen(false);
      setDeletingTag(null);
    } catch {
      setError('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-foreground-muted">Manage blog tags</p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground-muted mb-4">No tags yet.</p>
              <Button onClick={openCreateDialog}>Create your first tag</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-subtle"
                >
                  <span className="font-medium">#{tag.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tag._count.posts}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-error hover:text-error"
                    onClick={() => openDeleteDialog(tag)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag ? 'Update the tag details' : 'Add a new tag for your blog posts'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-md bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Tag name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="tag-slug"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTag?.name}&quot;?
              {deletingTag && deletingTag._count.posts > 0 && (
                <span className="block mt-2 text-warning">
                  This tag is used in {deletingTag._count.posts} post(s). The tag will be removed from those posts.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? (
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
