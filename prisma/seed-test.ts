import { PrismaClient, Role, PostStatus, CommentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test user credentials - use these in E2E tests
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    name: 'Test Admin',
    role: Role.ADMIN,
  },
  author: {
    email: 'author@test.com',
    password: 'TestPassword123!',
    name: 'Test Author',
    role: Role.AUTHOR,
  },
  subscriber: {
    email: 'subscriber@test.com',
    password: 'TestPassword123!',
    name: 'Test Subscriber',
    role: Role.SUBSCRIBER,
  },
};

async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.comment.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.media.deleteMany();
  // Keep existing admin user if any, but delete test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_USERS.admin.email, TEST_USERS.author.email, TEST_USERS.subscriber.email],
      },
    },
  });
}

async function seedTestUsers() {
  const users = [];

  for (const [key, userData] of Object.entries(TEST_USERS)) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        emailVerified: new Date(),
      },
    });
    users.push({ key, user });
    console.log(`Created ${key} user: ${user.email}`);
  }

  return users;
}

async function seedCategories() {
  const categories = [
    { name: 'Technology', slug: 'technology', description: 'Tech articles and tutorials', color: '#3B82F6' },
    { name: 'Life', slug: 'life', description: 'Personal stories and reflections', color: '#10B981' },
    { name: 'Travel', slug: 'travel', description: 'Travel adventures and tips', color: '#F59E0B' },
  ];

  const created = [];
  for (const cat of categories) {
    const category = await prisma.category.create({ data: cat });
    created.push(category);
    console.log(`Created category: ${category.name}`);
  }

  return created;
}

async function seedTags() {
  const tags = [
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'React', slug: 'react' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Testing', slug: 'testing' },
    { name: 'Tutorial', slug: 'tutorial' },
  ];

  const created = [];
  for (const tag of tags) {
    const createdTag = await prisma.tag.create({ data: tag });
    created.push(createdTag);
    console.log(`Created tag: ${createdTag.name}`);
  }

  return created;
}

async function seedPosts(adminId: string, authorId: string, categories: { id: string }[], tags: { id: string }[]) {
  const posts = [
    {
      title: 'Welcome to the Blog',
      slug: 'welcome-to-the-blog',
      content: '<p>This is the welcome post content. It contains some interesting information about the blog.</p><p>We hope you enjoy reading our articles!</p>',
      excerpt: 'Welcome to our blog! Discover interesting content here.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: adminId,
      categoryId: categories[0]?.id,
      tags: { connect: [{ id: tags[0]?.id }, { id: tags[1]?.id }] },
      allowComments: true,
      isFeatured: true,
      readingTime: 2,
    },
    {
      title: 'Getting Started with Next.js',
      slug: 'getting-started-with-nextjs',
      content: '<p>Next.js is a powerful React framework for building web applications.</p><h2>Features</h2><ul><li>Server-side rendering</li><li>Static site generation</li><li>API routes</li></ul>',
      excerpt: 'Learn the basics of Next.js and start building modern web apps.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      authorId: authorId,
      categoryId: categories[0]?.id,
      tags: { connect: [{ id: tags[0]?.id }, { id: tags[2]?.id }] },
      allowComments: true,
      readingTime: 5,
    },
    {
      title: 'Draft Post for Testing',
      slug: 'draft-post-for-testing',
      content: '<p>This is a draft post that should not be visible to regular users.</p>',
      excerpt: 'A draft post for testing purposes.',
      status: PostStatus.DRAFT,
      authorId: authorId,
      categoryId: categories[1]?.id,
      allowComments: true,
      readingTime: 1,
    },
    {
      title: 'My Travel Adventure',
      slug: 'my-travel-adventure',
      content: '<p>Sharing my recent travel experiences and adventures around the world.</p>',
      excerpt: 'Join me on an exciting travel adventure!',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      authorId: adminId,
      categoryId: categories[2]?.id,
      tags: { connect: [{ id: tags[4]?.id }] },
      allowComments: true,
      readingTime: 3,
    },
  ];

  const created = [];
  for (const post of posts) {
    const createdPost = await prisma.post.create({ data: post });
    created.push(createdPost);
    console.log(`Created post: ${createdPost.title} (${createdPost.status})`);
  }

  return created;
}

async function seedComments(posts: { id: string }[], subscriberId: string, authorId: string) {
  const comments = [
    {
      content: 'Great article! Very helpful.',
      postId: posts[0].id,
      authorId: subscriberId,
      status: CommentStatus.APPROVED,
    },
    {
      content: 'Thanks for sharing this information.',
      postId: posts[0].id,
      authorId: authorId,
      status: CommentStatus.APPROVED,
    },
    {
      content: 'This is a pending comment for moderation.',
      postId: posts[1].id,
      authorId: subscriberId,
      status: CommentStatus.PENDING,
    },
  ];

  for (const comment of comments) {
    const created = await prisma.comment.create({ data: comment });
    console.log(`Created comment: ${created.content.substring(0, 30)}... (${created.status})`);
  }
}

async function seedSubscribers() {
  const subscribers = [
    { email: 'verified@test.com', name: 'Verified User', isVerified: true, verifiedAt: new Date() },
    { email: 'unverified@test.com', name: 'Unverified User', isVerified: false },
  ];

  for (const sub of subscribers) {
    const created = await prisma.subscriber.create({ data: sub });
    console.log(`Created subscriber: ${created.email} (verified: ${created.isVerified})`);
  }
}

async function main() {
  console.log('Starting test database seed...\n');

  // Clean existing test data
  console.log('Cleaning database...');
  await cleanDatabase();
  console.log('Database cleaned.\n');

  // Seed users
  console.log('Seeding users...');
  const users = await seedTestUsers();
  const adminUser = users.find((u) => u.key === 'admin')!.user;
  const authorUser = users.find((u) => u.key === 'author')!.user;
  const subscriberUser = users.find((u) => u.key === 'subscriber')!.user;
  console.log('');

  // Seed categories
  console.log('Seeding categories...');
  const categories = await seedCategories();
  console.log('');

  // Seed tags
  console.log('Seeding tags...');
  const tags = await seedTags();
  console.log('');

  // Seed posts
  console.log('Seeding posts...');
  const posts = await seedPosts(adminUser.id, authorUser.id, categories, tags);
  console.log('');

  // Seed comments
  console.log('Seeding comments...');
  await seedComments(posts, subscriberUser.id, authorUser.id);
  console.log('');

  // Seed subscribers
  console.log('Seeding subscribers...');
  await seedSubscribers();
  console.log('');

  console.log('Test database seed completed successfully!');
  console.log('\nTest credentials:');
  console.log(`  Admin: ${TEST_USERS.admin.email} / ${TEST_USERS.admin.password}`);
  console.log(`  Author: ${TEST_USERS.author.email} / ${TEST_USERS.author.password}`);
  console.log(`  Subscriber: ${TEST_USERS.subscriber.email} / ${TEST_USERS.subscriber.password}`);
}

main()
  .catch((e) => {
    console.error('Error seeding test database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
