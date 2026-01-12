# TODO - Missing Features

This file tracks features that are planned but not yet implemented. Use this to guide future development.

**Last Updated:** 2026-01-11

---

## Priority Legend

- **P0** - Critical: Blocks core functionality
- **P1** - High: Important for usability
- **P2** - Medium: Nice to have
- **P3** - Low: Future enhancement

---

## Missing Features

### P0 - Critical

All P0 items completed!

---

### P1 - High Priority

All P1 items completed!

---

### P2 - Medium Priority

All P2 items completed!

---

### P3 - Low Priority (Future Enhancements)

| # | Feature | Description | Files Needed | Status |
|---|---------|-------------|--------------|--------|
| 16 | Email Verification | Verify user email on signup | Email template + verification flow | [ ] Not Started |
| 18 | Auto-save Drafts | Auto-save post while editing | Update editor component | [ ] Not Started |
| 19 | Spam Filtering | Filter spam comments | Integrate spam detection | [ ] Not Started |
| 20 | Comment Notifications | Email on new comments | Notification system | [ ] Not Started |
| 22 | Category RSS Feeds | RSS per category | `src/app/feed/[category]/route.ts` | [ ] Not Started |
| 23 | Activity Log UI | View admin activity | `src/app/admin/activity/page.tsx` | [ ] Not Started |
| 24 | Media Library UI | Browse/manage uploads | `src/app/admin/media/page.tsx` | [ ] Not Started |
| 26 | Related Posts | Show related posts | Algorithm + component | [ ] Not Started |
| 29 | Analytics Dashboard | View site statistics | `src/app/admin/analytics/page.tsx` | [ ] Not Started |

---

## Completed Features

| # | Feature | Completed Date | Notes |
|---|---------|----------------|-------|
| 1 | Post Edit Page | 2026-01-11 | `src/app/admin/posts/[id]/edit/page.tsx` |
| 2 | Post Update API | 2026-01-11 | Uses server actions in `src/app/actions/posts.ts` |
| 3 | Post Delete API | 2026-01-11 | Uses server actions in `src/app/actions/posts.ts` |
| 4 | Comment Delete API | 2026-01-11 | `src/app/api/comments/[id]/route.ts` |
| 5 | Category Filter Page | 2026-01-11 | `src/app/(public)/blog/category/[slug]/page.tsx` |
| 6 | Tag Filter Page | 2026-01-11 | `src/app/(public)/blog/tag/[slug]/page.tsx` |
| 7 | Post Pagination | 2026-01-11 | Updated `src/app/(public)/blog/page.tsx` |
| 8 | User Profile Page | 2026-01-11 | `src/app/(auth)/profile/page.tsx` + API |
| 9 | Archive Page | 2026-01-11 | `src/app/(public)/archive/page.tsx` |
| 10 | Sitemap.xml | 2026-01-11 | `src/app/sitemap.ts` |
| 11 | robots.txt | 2026-01-11 | `src/app/robots.ts` |
| 12 | Image Upload API | 2026-01-11 | `src/app/api/upload/route.ts` with Sharp resizing |
| 13 | Image Resizing | 2026-01-11 | Creates thumbnail, medium, and large sizes |
| 14 | Category Management UI | 2026-01-11 | `src/app/admin/categories/page.tsx` + API |
| 15 | Tag Management UI | 2026-01-11 | `src/app/admin/tags/page.tsx` + API |
| 17 | Password Reset | 2026-01-11 | Forgot/Reset password pages + API routes |
| 21 | JSON Feed | 2026-01-11 | `src/app/feed.json/route.ts` |
| 25 | Search Page | 2026-01-11 | `src/app/(public)/search/page.tsx` |
| 27 | Reading Progress Bar | 2026-01-11 | `src/components/blog/reading-progress.tsx` |
| 28 | Social Sharing | 2026-01-11 | `src/components/blog/social-share.tsx` |
| 30 | Custom 404 Page | 2026-01-11 | `src/app/not-found.tsx` |
| 31 | Custom Error Page | 2026-01-11 | `src/app/error.tsx` |

---

## Implementation Notes

### Image Upload (#12, #13)

Requirements:
- Accept image files (jpg, png, gif, webp)
- Resize to multiple sizes (thumbnail, medium, large)
- Convert to WebP for optimization
- Store in `public/uploads/` with organized folders
- Return URLs for use in editor

### Category/Tag Management UI (#14, #15)

Should include:
- List all categories/tags with post counts
- Create new category/tag
- Edit existing category/tag
- Delete category/tag (with confirmation)
- Reorder categories

---

## Quick Commands

```bash
# Start development
docker compose up -d && npm run dev

# Run tests after changes
npm test && npm run test:e2e

# Check types
npm run type-check

# Build for production
npm run build
```

---

## How to Use This File

1. Pick an item from the highest priority section
2. Update status to `[ ] In Progress`
3. Implement the feature
4. Run tests to verify
5. Update status to `[x] Complete` and move to Completed section
6. Commit with reference to the item number (e.g., "feat: add post edit page (TODO #1)")
