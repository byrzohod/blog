import { Page, Locator, expect } from '@playwright/test';

export class PostEditorPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly excerptInput: Locator;
  readonly contentEditor: Locator;
  readonly featuredImageUpload: Locator;
  readonly mediaLibraryButton: Locator;
  readonly categorySelect: Locator;
  readonly saveDraftButton: Locator;
  readonly publishButton: Locator;
  readonly updateButton: Locator;
  readonly deleteButton: Locator;
  readonly deleteConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use exact: true to avoid matching "Meta Title"
    this.titleInput = page.getByLabel('Title', { exact: true });
    this.slugInput = page.getByLabel('Slug');
    this.excerptInput = page.getByLabel('Excerpt');
    this.contentEditor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    // Image upload is now a drag-and-drop component
    this.featuredImageUpload = page.getByText(/drag.*drop|click.*upload/i).first();
    this.mediaLibraryButton = page.getByRole('button', { name: /media library|browse/i });
    this.categorySelect = page.getByLabel('Category');
    this.saveDraftButton = page.getByRole('button', { name: /save draft/i });
    this.publishButton = page.getByRole('button', { name: /publish/i });
    this.updateButton = page.getByRole('button', { name: /update/i });
    this.deleteButton = page.getByRole('button', { name: /delete/i });
    this.deleteConfirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
  }

  async gotoNew() {
    await this.page.goto('/admin/posts/new');
    // Wait for the form to load (client-side hydration)
    await this.page.waitForTimeout(1000);
  }

  async gotoEdit(postId: string) {
    await this.page.goto(`/admin/posts/${postId}/edit`);
    // Wait for the form to load (client-side hydration)
    await this.page.waitForTimeout(1000);
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillSlug(slug: string) {
    await this.slugInput.fill(slug);
  }

  async fillExcerpt(excerpt: string) {
    await this.excerptInput.fill(excerpt);
  }

  async fillContent(content: string) {
    await this.contentEditor.click();
    await this.contentEditor.fill(content);
  }

  async typeContent(content: string) {
    await this.contentEditor.click();
    await this.page.keyboard.type(content);
  }

  async expectFeaturedImageUploadVisible() {
    // Featured image is now an upload component, not a URL input
    await expect(this.featuredImageUpload).toBeVisible();
  }

  async selectCategory(categoryName: string) {
    await this.categorySelect.selectOption({ label: categoryName });
  }

  async saveDraft() {
    await this.saveDraftButton.click();
  }

  async publish() {
    await this.publishButton.click();
  }

  async update() {
    await this.updateButton.click();
  }

  async deletePost() {
    await this.deleteButton.click();
    // Wait for confirmation dialog
    await expect(this.deleteConfirmButton).toBeVisible();
    await this.deleteConfirmButton.click();
  }

  async expectSlugGenerated(expectedSlug: string) {
    await expect(this.slugInput).toHaveValue(expectedSlug);
  }

  async expectRedirectToList() {
    await expect(this.page).toHaveURL('/admin/posts');
  }

  async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    publish?: boolean;
  }) {
    await this.fillTitle(data.title);
    if (data.excerpt) {
      await this.fillExcerpt(data.excerpt);
    }
    await this.fillContent(data.content);
    if (data.category) {
      await this.selectCategory(data.category);
    }
    if (data.publish) {
      await this.publish();
    } else {
      await this.saveDraft();
    }
  }
}
