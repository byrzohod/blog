import { Page, Locator, expect } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly postsStatCard: Locator;
  readonly commentsStatCard: Locator;
  readonly subscribersStatCard: Locator;
  readonly recentPostsList: Locator;
  readonly sidebarNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.postsStatCard = page.locator('[data-testid="posts-stat"], :has-text("Posts")').first();
    this.commentsStatCard = page.locator('[data-testid="comments-stat"], :has-text("Comments")').first();
    this.subscribersStatCard = page.locator('[data-testid="subscribers-stat"], :has-text("Subscribers")').first();
    this.recentPostsList = page.locator('[data-testid="recent-posts"], :has-text("Recent Posts")');
    this.sidebarNav = page.locator('nav, aside').first();
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async expectDashboardVisible() {
    await expect(this.heading).toBeVisible();
  }

  async navigateTo(linkName: string) {
    await this.sidebarNav.getByRole('link', { name: new RegExp(linkName, 'i') }).click();
  }

  async navigateToPosts() {
    await this.navigateTo('posts');
    await expect(this.page).toHaveURL('/admin/posts');
  }

  async navigateToCategories() {
    await this.navigateTo('categories');
    await expect(this.page).toHaveURL('/admin/categories');
  }

  async navigateToTags() {
    await this.navigateTo('tags');
    await expect(this.page).toHaveURL('/admin/tags');
  }

  async getPostCount(): Promise<string> {
    const text = await this.postsStatCard.textContent();
    // Extract number from text like "12 Posts" or "Posts 12"
    const match = text?.match(/\d+/);
    return match ? match[0] : '0';
  }

  async clickRecentPost(postTitle: string) {
    await this.recentPostsList.getByRole('link', { name: postTitle }).click();
  }
}
