# Phase 4: Media Management Implementation

**Status:** Not Started
**Priority:** High
**Dependencies:** Phase 1 (Foundation), Phase 3 (Blog Core)
**Estimated Tasks:** 16

---

## Overview

Implement comprehensive image upload and management functionality. This includes processing images with Sharp, integrating with the Tiptap editor, and building a media library for managing uploaded files.

---

## Goals

1. Create secure file upload API
2. Process images with Sharp (resize, compress, convert)
3. Integrate image upload with Tiptap editor
4. Build media library for managing uploads
5. Implement image galleries for posts

---

## Tasks

### 4.1 Create Media Model

**File:** `prisma/schema.prisma` (update)

```prisma
model Media {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  width        Int?
  height       Int?

  // URLs for different sizes
  url          String   // Original
  thumbnailUrl String?  // 150x150
  smallUrl     String?  // 320px wide
  mediumUrl    String?  // 640px wide
  largeUrl     String?  // 1024px wide

  alt          String?
  caption      String?

  createdAt    DateTime @default(now())
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  uploadedById String

  @@map("media")
}

// Add to User model
model User {
  // ... existing fields
  media Media[]
}
```

Run migration:
```bash
npx prisma migrate dev --name add_media_model
```

**Acceptance Criteria:**
- [ ] Media model created with all size URLs
- [ ] Relation to User for tracking uploads
- [ ] Migration runs successfully

---

### 4.2 Set Up Upload Directory Structure

**File Structure:**
```
public/
└── uploads/
    ├── images/
    │   ├── original/
    │   ├── thumbnail/   (150x150)
    │   ├── small/       (320px)
    │   ├── medium/      (640px)
    │   └── large/       (1024px)
    └── files/           (future: PDFs, etc.)
```

**File:** `src/lib/upload.ts`

```typescript
import { mkdir } from 'fs/promises';
import path from 'path';

export const UPLOAD_BASE = path.join(process.cwd(), 'public', 'uploads');
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, fit: 'cover' as const },
  small: { width: 320, height: undefined },
  medium: { width: 640, height: undefined },
  large: { width: 1024, height: undefined },
} as const;

export async function ensureUploadDirs() {
  const dirs = [
    path.join(UPLOAD_BASE, 'images', 'original'),
    path.join(UPLOAD_BASE, 'images', 'thumbnail'),
    path.join(UPLOAD_BASE, 'images', 'small'),
    path.join(UPLOAD_BASE, 'images', 'medium'),
    path.join(UPLOAD_BASE, 'images', 'large'),
    path.join(UPLOAD_BASE, 'files'),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

export function getPublicUrl(relativePath: string): string {
  return `/uploads/${relativePath}`;
}
```

**Acceptance Criteria:**
- [ ] Directory structure created on first upload
- [ ] Unique filenames generated
- [ ] Public URLs generated correctly

---

### 4.3 Create Upload API Route

**File:** `src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import {
  UPLOAD_BASE,
  IMAGE_SIZES,
  ensureUploadDirs,
  generateFilename,
  getPublicUrl,
} from '@/lib/upload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    await ensureUploadDirs();

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = generateFilename(file.name);
    const baseFilename = path.parse(filename).name;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Save original
    const originalPath = path.join(UPLOAD_BASE, 'images', 'original', filename);
    await writeFile(originalPath, buffer);

    // Process and save different sizes
    const urls: Record<string, string> = {
      url: getPublicUrl(`images/original/${filename}`),
    };

    for (const [size, options] of Object.entries(IMAGE_SIZES)) {
      const outputFilename = `${baseFilename}.webp`;
      const outputPath = path.join(UPLOAD_BASE, 'images', size, outputFilename);

      let sharpInstance = sharp(buffer);

      if (options.height) {
        // Thumbnail: cover fit
        sharpInstance = sharpInstance.resize(options.width, options.height, {
          fit: 'cover',
        });
      } else {
        // Other sizes: resize width, maintain aspect ratio
        sharpInstance = sharpInstance.resize(options.width, undefined, {
          withoutEnlargement: true,
        });
      }

      await sharpInstance
        .webp({ quality: 80 })
        .toFile(outputPath);

      urls[`${size}Url`] = getPublicUrl(`images/${size}/${outputFilename}`);
    }

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        url: urls.url,
        thumbnailUrl: urls.thumbnailUrl,
        smallUrl: urls.smallUrl,
        mediumUrl: urls.mediumUrl,
        largeUrl: urls.largeUrl,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        smallUrl: media.smallUrl,
        mediumUrl: media.mediumUrl,
        largeUrl: media.largeUrl,
        width: media.width,
        height: media.height,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Validates file type and size
- [ ] Generates unique filenames
- [ ] Creates all size variants
- [ ] Converts to WebP format
- [ ] Saves metadata to database
- [ ] Returns URLs for all sizes

---

### 4.4 Install and Configure Sharp

```bash
npm install sharp
```

Sharp is already used in the upload route. Additional configuration:

**File:** `next.config.js` (if needed)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Sharp is used server-side, no special config needed
};

module.exports = nextConfig;
```

**Acceptance Criteria:**
- [ ] Sharp processes images without errors
- [ ] WebP conversion works
- [ ] EXIF data stripped for privacy

---

### 4.5-4.6 Image Processing Features

Already implemented in 4.3. Additional enhancements:

**EXIF Stripping:**
```typescript
// Add to sharp pipeline
sharpInstance
  .rotate() // Auto-rotate based on EXIF
  .withMetadata({ exif: {} }) // Remove EXIF data
```

**Acceptance Criteria:**
- [ ] Images auto-rotated correctly
- [ ] EXIF data removed
- [ ] Location data stripped

---

### 4.7 Create Drag-and-Drop Upload Component

**File:** `src/components/upload/image-uploader.tsx`

```typescript
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (media: UploadedMedia) => void;
  multiple?: boolean;
  className?: string;
}

interface UploadedMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export function ImageUploader({ onUpload, multiple = false, className }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        const result = await uploadFile(file);
        onUpload(result.media);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-accent bg-accent-muted'
          : 'border-border hover:border-accent/50',
        isUploading && 'pointer-events-none opacity-50',
        className
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
          <p className="text-foreground-muted">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-foreground-muted mb-4" />
          <p className="text-foreground mb-2">
            {isDragActive ? 'Drop the files here' : 'Drag & drop images here'}
          </p>
          <p className="text-sm text-foreground-muted">
            or click to select files
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
```

**Dependencies:**
```bash
npm install react-dropzone
```

**Acceptance Criteria:**
- [ ] Drag and drop works
- [ ] Click to select works
- [ ] Shows upload progress
- [ ] Validates file types
- [ ] Shows error messages

---

### 4.8 Add Tiptap Image Extension

**File:** `src/components/editor/extensions/image-upload.ts`

```typescript
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNode } from './image-node';

export interface ImageOptions {
  HTMLAttributes: Record<string, unknown>;
  uploadFn: (file: File) => Promise<{ url: string }>;
}

export const ImageUpload = Node.create<ImageOptions>({
  name: 'imageUpload',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
});
```

**File:** `src/components/editor/extensions/image-node.tsx`

```typescript
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Image from 'next/image';
import { useState } from 'react';

export function ImageNode({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <NodeViewWrapper className="my-4">
      <figure className="relative">
        <Image
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          width={node.attrs.width || 800}
          height={node.attrs.height || 600}
          className="rounded-lg max-w-full h-auto"
        />
        {isEditing ? (
          <input
            type="text"
            value={node.attrs.alt || ''}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            onBlur={() => setIsEditing(false)}
            placeholder="Add alt text..."
            className="mt-2 w-full p-2 text-sm border rounded"
            autoFocus
          />
        ) : (
          <figcaption
            onClick={() => setIsEditing(true)}
            className="mt-2 text-sm text-foreground-muted text-center cursor-pointer"
          >
            {node.attrs.alt || 'Click to add caption'}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}
```

**Acceptance Criteria:**
- [ ] Images display in editor
- [ ] Can edit alt text inline
- [ ] Images responsive in editor

---

### 4.9 Implement Inline Image Upload in Editor

Update editor toolbar to support image upload:

```typescript
// In editor-toolbar.tsx
const handleImageUpload = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const { media } = await response.json();

    editor
      .chain()
      .focus()
      .setImage({
        src: media.largeUrl || media.url,
        alt: '',
      })
      .run();
  };

  input.click();
};
```

Also support paste from clipboard:

```typescript
// In TiptapEditor
editorProps: {
  handlePaste: (view, event) => {
    const items = event.clipboardData?.items;
    if (!items) return false;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Upload and insert
        }
        return true;
      }
    }
    return false;
  },
}
```

**Acceptance Criteria:**
- [ ] Can upload via toolbar button
- [ ] Can paste images from clipboard
- [ ] Images inserted at cursor position

---

### 4.10 Create Featured Image Selector

**File:** `src/components/admin/featured-image-selector.tsx`

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageUploader } from '@/components/upload/image-uploader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Image as ImageIcon, X } from 'lucide-react';

interface FeaturedImageSelectorProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function FeaturedImageSelector({ value, onChange }: FeaturedImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUpload = (media: { url: string; largeUrl?: string }) => {
    onChange(media.largeUrl || media.url);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Featured Image</label>

      {value ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
          <Image
            src={value}
            alt="Featured image"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full h-32">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-foreground-muted" />
                <span>Add featured image</span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Featured Image</DialogTitle>
            </DialogHeader>
            <ImageUploader onUpload={handleUpload} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Can upload new featured image
- [ ] Shows preview of selected image
- [ ] Can remove selected image

---

### 4.11 Build Media Library Page

**File:** `src/app/admin/media/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { MediaGrid } from '@/components/admin/media-grid';
import { ImageUploader } from '@/components/upload/image-uploader';

export const metadata: Metadata = {
  title: 'Media Library',
};

export default async function MediaLibraryPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="container-wide py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Media Library</h1>
      </div>

      <div className="mb-8">
        <ImageUploader
          onUpload={() => {
            // Refresh page or update list
          }}
          multiple
        />
      </div>

      <MediaGrid media={media} />
    </div>
  );
}
```

**File:** `src/components/admin/media-grid.tsx`

Grid display with:
- Thumbnail previews
- File info on hover
- Select for insertion
- Delete option
- Search/filter

**Acceptance Criteria:**
- [ ] Shows all uploaded media
- [ ] Can search by filename
- [ ] Can delete media
- [ ] Shows file size and dimensions

---

### 4.12 Add Image Gallery Component

**File:** `src/components/blog/image-gallery.tsx`

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
}

export function ImageGallery({ images, columns = 3 }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  const next = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const prev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="aspect-square relative rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={image.url}
              alt={image.alt || ''}
              fill
              className="object-cover hover:scale-105 transition-transform"
            />
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90">
          {selectedIndex !== null && (
            <div className="relative">
              <Image
                src={images[selectedIndex].url}
                alt={images[selectedIndex].alt || ''}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto mx-auto"
              />

              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
              >
                <X className="h-6 w-6 text-white" />
              </button>

              {images[selectedIndex].caption && (
                <p className="absolute bottom-4 left-0 right-0 text-center text-white">
                  {images[selectedIndex].caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Grid layout with configurable columns
- [ ] Lightbox opens on click
- [ ] Navigation between images
- [ ] Shows captions

---

### 4.13-4.14 Lightbox and Alt Text

Already implemented in components above.

**Acceptance Criteria:**
- [ ] Lightbox smooth transitions
- [ ] Keyboard navigation (arrows, escape)
- [ ] Alt text editable in media library

---

### 4.15 Implement Lazy Loading

Next.js Image component handles lazy loading by default. Additional optimization:

```typescript
// For images below the fold
<Image
  src={url}
  alt={alt}
  loading="lazy"
  placeholder="blur"
  blurDataURL={thumbnailUrl} // Use thumbnail as placeholder
/>
```

**Acceptance Criteria:**
- [ ] Images load on scroll
- [ ] Placeholder shown while loading
- [ ] No layout shift

---

### 4.16 Add Image Deletion with Cleanup

**File:** `src/app/api/media/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';
import { UPLOAD_BASE } from '@/lib/upload';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN', 'AUTHOR']);

    const media = await prisma.media.findUnique({
      where: { id: params.id },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete files from filesystem
    const filesToDelete = [
      media.url,
      media.thumbnailUrl,
      media.smallUrl,
      media.mediumUrl,
      media.largeUrl,
    ].filter(Boolean);

    for (const url of filesToDelete) {
      const filePath = path.join(process.cwd(), 'public', url!);
      try {
        await unlink(filePath);
      } catch {
        // File may already be deleted
      }
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Deletes all size variants
- [ ] Removes from database
- [ ] Handles missing files gracefully

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Add Media model |
| `src/lib/upload.ts` | Created | Upload utilities |
| `src/app/api/upload/route.ts` | Created | Upload endpoint |
| `src/app/api/media/[id]/route.ts` | Created | Delete endpoint |
| `src/components/upload/*.tsx` | Created | Upload components |
| `src/components/editor/extensions/*.tsx` | Created | Editor image support |
| `src/components/admin/media-*.tsx` | Created | Media library |
| `src/components/blog/image-gallery.tsx` | Created | Gallery display |

---

## Dependencies

```json
{
  "dependencies": {
    "sharp": "^0.33.x",
    "react-dropzone": "^14.x"
  }
}
```

---

## Testing Checklist

- [ ] Can upload images via drag-and-drop
- [ ] Can upload via click to select
- [ ] Images processed to multiple sizes
- [ ] WebP conversion works
- [ ] Images display in editor
- [ ] Can paste images from clipboard
- [ ] Featured image selector works
- [ ] Media library shows all uploads
- [ ] Can delete images
- [ ] Lightbox works correctly
- [ ] Images lazy load
