import { prisma } from '@/lib/db';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

  // Find the category
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    return new Response('Category not found', { status: 404 });
  }

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      categoryId: category.id,
    },
    include: {
      author: {
        select: { name: true },
      },
      tags: {
        select: { name: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Book of Life - ${escapeXml(category.name)}</title>
    <link>${siteUrl}/blog/category/${slug}</link>
    <description>Posts in the ${escapeXml(category.name)} category from Book of Life.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed/category/${slug}" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || '')}</description>
      <pubDate>${post.publishedAt?.toUTCString() || ''}</pubDate>
      <author>${escapeXml(post.author.name || 'Author')}</author>
      <category>${escapeXml(category.name)}</category>
      ${post.tags.map((tag) => `<category>${escapeXml(tag.name)}</category>`).join('')}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
