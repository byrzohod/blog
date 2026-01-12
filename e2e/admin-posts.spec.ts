import { test, expect } from './fixtures/auth.fixture';
import { PostEditorPage } from './pages/post-editor.page';

test.describe('Admin Posts', () => {
  test.describe('Posts List', () => {
    test('should display posts list', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Should have posts heading
      await expect(adminPage.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible();
    });

    test('should show post table with titles', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Should have table with posts
      const table = adminPage.locator('table');
      await expect(table).toBeVisible();

      // Should show post title from seed data (links to edit page)
      const postLink = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]').first();
      await expect(postLink).toBeVisible();
    });

    test('should have create new post button', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      const newPostButton = adminPage.getByRole('link', { name: /new post/i });
      await expect(newPostButton).toBeVisible();

      await newPostButton.click();
      await expect(adminPage).toHaveURL('/admin/posts/new');
    });

    test('should have edit link for each post', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Post titles are links to edit page
      const editLinks = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]');
      await expect(editLinks.first()).toBeVisible();
    });

    test('should show post status badges', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Should show status indicators (lowercase)
      const statusBadge = adminPage.getByText(/published|draft|archived/);
      await expect(statusBadge.first()).toBeVisible();
    });
  });

  test.describe('Create Post', () => {
    test('should display new post form', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Wait for page to hydrate (client component)
      await adminPage.waitForTimeout(1000);

      // Should have form fields (use exact: true to avoid matching "Meta Title")
      await expect(adminPage.getByLabel('Title', { exact: true })).toBeVisible();
      await expect(adminPage.getByLabel('Slug')).toBeVisible();
    });

    test('should auto-generate slug from title', async ({ adminPage }) => {
      const editor = new PostEditorPage(adminPage);
      await editor.gotoNew();

      // Type a title and blur to trigger slug generation
      await editor.fillTitle('My Amazing Test Post');
      await adminPage.getByLabel('Slug').click(); // Blur title to trigger slug generation

      // Wait for slug generation
      await adminPage.waitForTimeout(500);

      // Slug should be auto-generated
      const slugValue = await editor.slugInput.inputValue();
      expect(slugValue).toContain('my-amazing-test-post');
    });

    test('should save post as draft', async ({ adminPage }) => {
      const editor = new PostEditorPage(adminPage);
      await editor.gotoNew();

      const uniqueTitle = `Draft Post ${Date.now()}`;

      await editor.fillTitle(uniqueTitle);
      await editor.typeContent('This is the content of my draft post.');
      await editor.saveDraft();

      // Wait for save to complete and redirect
      await adminPage.waitForTimeout(2000);

      // Should redirect to posts list
      await adminPage.waitForURL('/admin/posts', { timeout: 10000 });

      // Verify post appears in list
      await expect(adminPage.getByText(uniqueTitle)).toBeVisible();
    });

    test('should publish post directly', async ({ adminPage }) => {
      const editor = new PostEditorPage(adminPage);
      await editor.gotoNew();

      const uniqueTitle = `Published Post ${Date.now()}`;

      await editor.fillTitle(uniqueTitle);
      await editor.fillExcerpt('A short excerpt for the post.');
      await editor.typeContent('This is a published post content.');
      await editor.publish();

      // Wait for publish to complete and redirect
      await adminPage.waitForTimeout(2000);

      // Should redirect to posts list
      await adminPage.waitForURL('/admin/posts', { timeout: 10000 });

      // Verify post appears in list
      await expect(adminPage.getByText(uniqueTitle)).toBeVisible();
    });

    test('should have rich text editor', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Wait for page to hydrate (client component)
      await adminPage.waitForTimeout(1000);

      // Should have content editor (Tiptap)
      const editor = adminPage.locator('.ProseMirror, [contenteditable="true"]');
      await expect(editor.first()).toBeVisible();
    });

    test('should have featured image field', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Wait for page to hydrate (client component)
      await adminPage.waitForTimeout(1000);

      // Featured image uses "Image URL" label
      const imageInput = adminPage.getByLabel('Image URL');
      await expect(imageInput).toBeVisible();
    });
  });

  test.describe('Edit Post', () => {
    test('should load existing post data', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Click on the first post title link
      const postLink = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]').first();
      await postLink.click();

      // Wait for page load
      await adminPage.waitForURL(/\/admin\/posts\/.+\/edit/);

      // Title should be filled
      const titleInput = adminPage.getByLabel('Title');
      await expect(titleInput).not.toBeEmpty();
    });

    test('should update post title', async ({ adminPage }) => {
      // First create a post to edit
      const editor = new PostEditorPage(adminPage);
      await editor.gotoNew();

      const originalTitle = `Post to Edit ${Date.now()}`;
      await editor.fillTitle(originalTitle);
      await editor.typeContent('Content for editing test.');
      await editor.saveDraft();

      await adminPage.waitForURL('/admin/posts', { timeout: 5000 });

      // Click on our post to edit it
      await adminPage.getByText(originalTitle).click();
      await adminPage.waitForURL(/\/admin\/posts\/.+\/edit/);

      // Update the title
      const titleInput = adminPage.getByLabel('Title');
      const updatedTitle = `${originalTitle} (Updated)`;
      await titleInput.fill(updatedTitle);

      // Click Save Draft button
      await adminPage.getByRole('button', { name: /save draft/i }).click();

      // Wait for save
      await adminPage.waitForTimeout(1000);

      // Go back to list and verify
      await adminPage.goto('/admin/posts');
      await expect(adminPage.getByText(updatedTitle)).toBeVisible();
    });

    test('should have delete button', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      // Click on the first post title link
      const postLink = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]').first();
      await postLink.click();

      await adminPage.waitForURL(/\/admin\/posts\/.+\/edit/);

      // Should have delete button with text "Delete"
      const deleteButton = adminPage.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
    });
  });

  test.describe('Delete Post', () => {
    test('should show confirmation dialog before delete', async ({ adminPage }) => {
      // First create a post to delete
      const editor = new PostEditorPage(adminPage);
      await editor.gotoNew();

      const uniqueTitle = `Post to Delete ${Date.now()}`;
      await editor.fillTitle(uniqueTitle);
      await editor.typeContent('This post will be deleted.');
      await editor.saveDraft();

      await adminPage.waitForURL('/admin/posts', { timeout: 5000 });

      // Find and click edit for our post
      await adminPage.getByText(uniqueTitle).click();
      await adminPage.waitForURL(/\/admin\/posts\/.+\/edit/);

      // Click delete button
      const deleteButton = adminPage.getByRole('button', { name: 'Delete' });
      await deleteButton.click();

      // Should show confirmation dialog
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(adminPage.getByText(/are you sure/i)).toBeVisible();
    });
  });

  test.describe('Author Permissions', () => {
    test('should allow author to create post', async ({ authorPage }) => {
      await authorPage.goto('/admin/posts/new');

      // Author should be able to access new post page
      await expect(authorPage.getByLabel('Title')).toBeVisible();
    });

    test('should allow author to create and view own post', async ({ authorPage }) => {
      // Create a post as author
      const editor = new PostEditorPage(authorPage);
      await editor.gotoNew();

      const uniqueTitle = `Author Post ${Date.now()}`;
      await editor.fillTitle(uniqueTitle);
      await editor.typeContent('Post created by author.');
      await editor.saveDraft();

      await authorPage.waitForURL('/admin/posts', { timeout: 5000 });

      // Should be able to see it in the list
      await expect(authorPage.getByText(uniqueTitle)).toBeVisible();
    });
  });
});
