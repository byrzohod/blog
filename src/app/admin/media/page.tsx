'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  width: number;
  height: number;
  alt: string | null;
  createdAt: string;
  uploadedBy: {
    name: string | null;
  } | null;
}

interface MediaResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'smallest'>('newest');

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/upload?page=${page}&limit=20`);
      if (response.ok) {
        const data: MediaResponse = await response.json();
        let sortedMedia = [...data.media];

        // Apply client-side sorting
        switch (sortBy) {
          case 'oldest':
            sortedMedia.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'largest':
            sortedMedia.sort((a, b) => b.size - a.size);
            break;
          case 'smallest':
            sortedMedia.sort((a, b) => a.size - b.size);
            break;
          default:
            // 'newest' is default from API
            break;
        }

        // Apply client-side search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          sortedMedia = sortedMedia.filter(
            (item) =>
              item.originalName.toLowerCase().includes(query) ||
              item.filename.toLowerCase().includes(query) ||
              (item.alt && item.alt.toLowerCase().includes(query))
          );
        }

        setMedia(sortedMedia);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, searchQuery]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      }
      // Refresh the media list
      await fetchMedia();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/upload/${mediaToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMedia();
        setIsDeleteDialogOpen(false);
        setMediaToDelete(null);
        if (selectedMedia?.id === mediaToDelete.id) {
          setIsDetailOpen(false);
          setSelectedMedia(null);
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete media');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const openMediaDetail = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-foreground-muted">Manage your uploaded images and files</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {total} files
        </Badge>
      </div>

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-accent/10 rounded-full">
              <Upload className="h-8 w-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="font-medium">Drag and drop files here</p>
              <p className="text-sm text-foreground-muted">or click to browse</p>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select Files'}
            </Button>
            <p className="text-xs text-foreground-muted">
              Supported: JPEG, PNG, GIF, WebP. Max 10MB per file.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-foreground-muted mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Search by filename or alt text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-40">
              <label className="text-sm text-foreground-muted mb-1 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="largest">Largest First</SelectItem>
                  <SelectItem value="smallest">Smallest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <ImageIcon className="h-8 w-8 animate-pulse text-accent" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
              <p className="text-foreground-muted">No media files found</p>
              <Button
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Upload your first file
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square bg-background-muted rounded-lg overflow-hidden cursor-pointer border border-border hover:border-accent transition-colors"
                  onClick={() => openMediaDetail(item)}
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.url);
                        }}
                      >
                        {copiedUrl === item.url ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMediaToDelete(item);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-background-subtle transition-colors cursor-pointer"
                  onClick={() => openMediaDetail(item)}
                >
                  <div className="w-16 h-16 bg-background-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.alt || item.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.originalName}</p>
                    <p className="text-sm text-foreground-muted">
                      {item.width} x {item.height} &bull; {formatBytes(item.size)}
                    </p>
                  </div>
                  <div className="text-sm text-foreground-muted whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.url);
                      }}
                    >
                      {copiedUrl === item.url ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaToDelete(item);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Media Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
            <DialogDescription>
              View and manage media file details
            </DialogDescription>
          </DialogHeader>
          {selectedMedia && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background-muted rounded-lg overflow-hidden">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt || selectedMedia.originalName}
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground-muted">Filename</label>
                  <p className="font-medium">{selectedMedia.originalName}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Dimensions</label>
                  <p className="font-medium">
                    {selectedMedia.width} x {selectedMedia.height} px
                  </p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Size</label>
                  <p className="font-medium">{formatBytes(selectedMedia.size)}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Uploaded</label>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
                    {selectedMedia.uploadedBy?.name && ` by ${selectedMedia.uploadedBy.name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Alt Text</label>
                  <p className="font-medium">{selectedMedia.alt || 'Not set'}</p>
                </div>

                <div className="pt-4 space-y-2">
                  <label className="text-sm text-foreground-muted">Available Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedMedia.url)}
                    >
                      {copiedUrl === selectedMedia.url ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      Original
                    </Button>
                    {selectedMedia.largeUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedMedia.largeUrl!)}
                      >
                        {copiedUrl === selectedMedia.largeUrl ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Large
                      </Button>
                    )}
                    {selectedMedia.mediumUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedMedia.mediumUrl!)}
                      >
                        {copiedUrl === selectedMedia.mediumUrl ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Medium
                      </Button>
                    )}
                    {selectedMedia.thumbnailUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedMedia.thumbnailUrl!)}
                      >
                        {copiedUrl === selectedMedia.thumbnailUrl ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Thumbnail
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedMedia.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Original
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setMediaToDelete(selectedMedia);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {mediaToDelete && (
            <div className="flex items-center gap-4 p-4 bg-background-muted rounded-lg">
              <div className="w-16 h-16 bg-background rounded overflow-hidden flex-shrink-0">
                <img
                  src={mediaToDelete.thumbnailUrl || mediaToDelete.url}
                  alt={mediaToDelete.alt || mediaToDelete.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{mediaToDelete.originalName}</p>
                <p className="text-sm text-foreground-muted">{formatBytes(mediaToDelete.size)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
