import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 20,
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Book of Life',
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    description: 'Personal blog sharing thoughts, stories, and ideas.',
    icon: `${baseUrl}/icon.png`,
    favicon: `${baseUrl}/favicon.ico`,
    authors: [
      {
        name: 'Book of Life',
        url: baseUrl,
      },
    ],
    language: 'en',
    items: posts.map((post) => ({
      id: `${baseUrl}/blog/${post.slug}`,
      url: `${baseUrl}/blog/${post.slug}`,
      title: post.title,
      content_html: post.content,
      summary: post.excerpt || undefined,
      image: post.featuredImage || undefined,
      date_published: post.publishedAt?.toISOString(),
      date_modified: post.updatedAt.toISOString(),
      authors: post.author.name
        ? [{ name: post.author.name }]
        : undefined,
      tags: post.tags.map((tag) => tag.name),
    })),
  };

  return NextResponse.json(feed, {
    headers: {
      'Content-Type': 'application/feed+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
