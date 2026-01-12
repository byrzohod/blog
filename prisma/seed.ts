import { PrismaClient, Role, PostStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const hashedPassword = await hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookoflife.com' },
    update: {},
    create: {
      email: 'admin@bookoflife.com',
      name: 'Sarkis Haralampiev',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log('Created admin user:', admin.email);

  // Create default categories
  const categories = [
    { name: 'Life', slug: 'life', description: 'Personal experiences and life stories' },
    { name: 'Technology', slug: 'technology', description: 'Tech insights and discussions' },
    { name: 'Thoughts', slug: 'thoughts', description: 'Reflections and musings' },
    { name: 'Travel', slug: 'travel', description: 'Adventures and explorations' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('Created categories:', categories.map(c => c.name).join(', '));

  // Create some initial tags
  const tags = [
    { name: 'personal', slug: 'personal' },
    { name: 'coding', slug: 'coding' },
    { name: 'reflection', slug: 'reflection' },
    { name: 'tutorial', slug: 'tutorial' },
    { name: 'story', slug: 'story' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log('Created tags:', tags.map(t => t.name).join(', '));

  // Get the "Life" category for the welcome post
  const lifeCategory = await prisma.category.findUnique({
    where: { slug: 'life' },
  });

  // Create welcome post
  const welcomePost = await prisma.post.upsert({
    where: { slug: 'welcome-to-book-of-life' },
    update: {},
    create: {
      title: 'Welcome to Book of Life',
      slug: 'welcome-to-book-of-life',
      excerpt: 'An introduction to my personal blog where I share my thoughts, experiences, and stories.',
      content: `
<h2>Hello and Welcome!</h2>
<p>Welcome to <strong>Book of Life</strong>, my personal corner of the internet where I share my journey, thoughts, and experiences.</p>
<p>This blog is my digital diary, a place where I document the chapters of my life. Here you'll find:</p>
<ul>
<li><strong>Personal Stories</strong> - Experiences that shaped who I am</li>
<li><strong>Technical Insights</strong> - Things I've learned in my work</li>
<li><strong>Reflections</strong> - Thoughts on life, growth, and the world around us</li>
<li><strong>Adventures</strong> - Places I've been and things I've done</li>
</ul>
<h2>Why "Book of Life"?</h2>
<p>I believe every person's life is a story worth telling. This blog is my attempt to write mine, one post at a time. It's not about being perfect or having all the answers. It's about documenting the journey, the learnings, and the growth.</p>
<h2>Stay Connected</h2>
<p>I'd love for you to join me on this journey. You can:</p>
<ul>
<li>Subscribe via email to get notified of new posts</li>
<li>Follow the RSS feed if you prefer</li>
<li>Leave comments and share your thoughts</li>
</ul>
<p>Thank you for being here. Let's make this journey together.</p>
      `.trim(),
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: lifeCategory?.id,
    },
  });

  console.log('Created welcome post:', welcomePost.title);

  // Create default static pages
  const pages = [
    {
      title: 'About',
      slug: 'about',
      content: `
<h1>About Me</h1>
<p>Hello! I'm Sarkis Haralampiev, the author of this blog.</p>
<p>Welcome to my Book of Life, a personal blog where I share my thoughts, experiences, and stories.</p>
<h2>What You'll Find Here</h2>
<p>This blog is a mix of:</p>
<ul>
<li>Personal reflections and life lessons</li>
<li>Technical articles and insights</li>
<li>Travel stories and adventures</li>
<li>Random thoughts that cross my mind</li>
</ul>
<h2>Get in Touch</h2>
<p>Feel free to reach out through the contact page or leave comments on any post. I'd love to hear from you!</p>
      `.trim(),
      isPublished: true,
    },
    {
      title: 'Contact',
      slug: 'contact',
      content: `
<h1>Contact Me</h1>
<p>I'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.</p>
<h2>Ways to Connect</h2>
<ul>
<li><strong>Email:</strong> hello@bookoflife.com</li>
<li><strong>Comments:</strong> Leave a comment on any blog post</li>
</ul>
<p>I try to respond to all messages, though it might take a few days depending on my schedule.</p>
      `.trim(),
      isPublished: true,
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('Created pages:', pages.map(p => p.title).join(', '));

  // Create default settings
  const settings = [
    { key: 'site_title', value: 'Book of Life' },
    { key: 'site_description', value: 'A personal chronicle of thoughts, experiences, and stories' },
    { key: 'posts_per_page', value: '10' },
    { key: 'allow_comments', value: 'true' },
    { key: 'require_comment_approval', value: 'true' },
    { key: 'allow_subscriptions', value: 'true' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Created settings');

  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
