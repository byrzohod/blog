# Admin Improvements Plan

## Overview

This document outlines the plan to fix admin functionality issues, add image upload to post editor, and create comprehensive E2E tests.

---

## Issues Identified

### 1. Missing Admin Pages (404 Errors)
The admin navigation links to pages that don't exist:
- `/admin/comments` - Empty directory, no page.tsx
- `/admin/users` - Empty directory, no page.tsx
- `/admin/settings` - Empty directory, no page.tsx
- `/admin/subscribers` - Empty directory, no page.tsx (not in nav but exists)

### 2. Featured Image Upload
Currently the post editor only accepts an image URL. Users need to:
- Upload images directly from their computer
- Select from existing media library
- Preview the selected image

### 3. Slug Explanation (For Reference)
A **slug** is a URL-friendly version of a title:
- Title: "My First Blog Post!"
- Slug: `my-first-blog-post`

Used in URLs: `/blog/my-first-blog-post`

The slug is auto-generated from the title when you blur out of the title field, but can be manually edited.

---

## Implementation Plan

### Phase 1: Fix Missing Admin Pages

#### 1.1 Comments Management Page (`/admin/comments`)
**File:** `src/app/admin/comments/page.tsx`

Features:
- List all comments with filters (pending, approved, spam, trash)
- Show comment content, author, post title, date
- Bulk actions (approve, reject, spam, delete)
- Quick reply functionality
- Pagination

#### 1.2 Users Management Page (`/admin/users`)
**File:** `src/app/admin/users/page.tsx`

Features:
- List all users with role badges
- Filter by role (ADMIN, AUTHOR, SUBSCRIBER)
- Change user roles
- View user activity
- Pagination

#### 1.3 Settings Page (`/admin/settings`)
**File:** `src/app/admin/settings/page.tsx`

Features:
- Site settings (title, description, logo)
- Email configuration (SMTP settings display)
- Comment settings (moderation, spam threshold)
- SEO defaults

#### 1.4 Subscribers Page (`/admin/subscribers`)
**File:** `src/app/admin/subscribers/page.tsx`

Features:
- List all email subscribers
- Export subscribers as CSV
- Delete subscribers
- View subscription date

---

### Phase 2: Featured Image Upload in Post Editor

#### 2.1 Create Image Upload Component
**File:** `src/components/editor/image-upload.tsx`

Features:
- Drag-and-drop zone
- Click to select file
- Preview uploaded image
- Remove/change image button
- Progress indicator during upload
- Browse media library button

#### 2.2 Update Post Editor
**File:** `src/app/admin/posts/new/page.tsx` (modify)
**File:** `src/app/admin/posts/[id]/edit/page.tsx` (modify)

Changes:
- Replace URL input with ImageUpload component
- Add "Browse Media Library" dialog
- Show image preview
- Store uploaded image URL

#### 2.3 Create Media Picker Dialog
**File:** `src/components/editor/media-picker-dialog.tsx`

Features:
- Modal showing media library grid
- Search/filter media
- Select image to insert
- Returns selected image URL

---

### Phase 3: API Routes for Admin Features

#### 3.1 Comments API Enhancement
**File:** `src/app/api/admin/comments/route.ts`

Endpoints:
- GET - List comments with filters and pagination
- PATCH - Bulk update status

#### 3.2 Users API
**File:** `src/app/api/admin/users/route.ts`

Endpoints:
- GET - List users with filters
- PATCH - Update user role

#### 3.3 Settings API
**File:** `src/app/api/admin/settings/route.ts`

Endpoints:
- GET - Get all settings
- PUT - Update settings

#### 3.4 Subscribers API
**File:** `src/app/api/admin/subscribers/route.ts`

Endpoints:
- GET - List subscribers
- DELETE - Remove subscriber

---

### Phase 4: E2E Tests

#### 4.1 Admin Comments Tests
**File:** `e2e/admin-comments.spec.ts`

Test cases:
- [ ] Navigate to comments page
- [ ] Filter comments by status
- [ ] Approve pending comment
- [ ] Reject comment (mark as spam)
- [ ] Delete comment
- [ ] Bulk approve comments
- [ ] Reply to comment
- [ ] Pagination works

#### 4.2 Admin Users Tests
**File:** `e2e/admin-users.spec.ts`

Test cases:
- [ ] Navigate to users page
- [ ] List shows all users
- [ ] Filter by role
- [ ] Change user role
- [ ] Pagination works

#### 4.3 Admin Settings Tests
**File:** `e2e/admin-settings.spec.ts`

Test cases:
- [ ] Navigate to settings page
- [ ] Update site title
- [ ] Update site description
- [ ] Save settings persists
- [ ] Cancel reverts changes

#### 4.4 Admin Subscribers Tests
**File:** `e2e/admin-subscribers.spec.ts`

Test cases:
- [ ] Navigate to subscribers page
- [ ] List shows all subscribers
- [ ] Delete subscriber
- [ ] Export subscribers CSV

#### 4.5 Post Editor Image Upload Tests
**File:** `e2e/admin-posts.spec.ts` (extend existing)

Test cases:
- [ ] Upload featured image via drag-drop
- [ ] Upload featured image via file picker
- [ ] Preview shows uploaded image
- [ ] Remove featured image
- [ ] Browse media library
- [ ] Select image from media library

#### 4.6 Full Admin Workflow Tests
**File:** `e2e/admin-workflow.spec.ts`

Test cases:
- [ ] Create post with uploaded image
- [ ] Edit post and change image
- [ ] Moderate comment on post
- [ ] View analytics for post
- [ ] Complete admin workflow

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── comments/
│   │   │   └── page.tsx          # NEW
│   │   ├── users/
│   │   │   └── page.tsx          # NEW
│   │   ├── settings/
│   │   │   └── page.tsx          # NEW
│   │   ├── subscribers/
│   │   │   └── page.tsx          # NEW
│   │   └── posts/
│   │       ├── new/
│   │       │   └── page.tsx      # MODIFY
│   │       └── [id]/edit/
│   │           └── page.tsx      # MODIFY
│   └── api/
│       └── admin/
│           ├── comments/
│           │   └── route.ts      # NEW
│           ├── users/
│           │   └── route.ts      # NEW
│           ├── settings/
│           │   └── route.ts      # NEW
│           └── subscribers/
│               └── route.ts      # NEW
├── components/
│   └── editor/
│       ├── image-upload.tsx      # NEW
│       └── media-picker-dialog.tsx # NEW
e2e/
├── admin-comments.spec.ts        # NEW
├── admin-users.spec.ts           # NEW
├── admin-settings.spec.ts        # NEW
├── admin-subscribers.spec.ts     # NEW
├── admin-workflow.spec.ts        # NEW
└── admin-posts.spec.ts           # EXTEND
```

---

## Implementation Order

1. **Phase 1: Missing Pages** (fixes 404 errors immediately)
   - Comments page
   - Users page
   - Settings page
   - Subscribers page

2. **Phase 2: Image Upload**
   - ImageUpload component
   - MediaPicker dialog
   - Update post editors

3. **Phase 3: API Routes**
   - Comments API
   - Users API
   - Settings API
   - Subscribers API

4. **Phase 4: E2E Tests**
   - Admin comments tests
   - Admin users tests
   - Admin settings tests
   - Admin subscribers tests
   - Post editor image upload tests
   - Full workflow tests

---

## Estimated New Files

| Type | Count |
|------|-------|
| Admin Pages | 4 |
| API Routes | 4 |
| Components | 2 |
| E2E Test Files | 5 |
| **Total** | **15** |

---

## Dependencies

No new npm packages required. Using existing:
- React Hook Form
- Zod validation
- Radix UI components
- Lucide icons
- Playwright for E2E

---

## Success Criteria

1. All admin navigation links work (no 404 errors)
2. Users can upload images directly in post editor
3. Users can select images from media library
4. All admin pages are functional
5. E2E tests pass for all admin functionality
6. Tests run in CI/CD pipeline

---

## Commands

```bash
# Run E2E tests for admin
npx playwright test e2e/admin-*.spec.ts --project=chromium

# Run specific test file
npx playwright test e2e/admin-comments.spec.ts

# Run with UI mode for debugging
npx playwright test e2e/admin-*.spec.ts --ui
```
