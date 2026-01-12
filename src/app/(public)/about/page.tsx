import { Metadata } from 'next';
import { prisma } from '@/lib/db';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about the author of Book of Life.',
};

async function getAboutPage() {
  return prisma.page.findUnique({
    where: { slug: 'about' },
  });
}

export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <div className="container-prose py-12">
      {page ? (
        <article>
          <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      ) : (
        <article>
          <h1 className="text-4xl font-bold mb-8">About Me</h1>
          <div className="blog-content">
            <p>
              Hello! I&apos;m Sarkis Haralampiev, the author of this blog.
            </p>
            <p>
              Welcome to my Book of Life, a personal blog where I share my
              thoughts, experiences, and stories.
            </p>
            <h2>What You&apos;ll Find Here</h2>
            <p>This blog is a mix of:</p>
            <ul>
              <li>Personal reflections and life lessons</li>
              <li>Technical articles and insights</li>
              <li>Travel stories and adventures</li>
              <li>Random thoughts that cross my mind</li>
            </ul>
            <h2>Get in Touch</h2>
            <p>
              Feel free to reach out through the contact page or leave comments
              on any post. I&apos;d love to hear from you!
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
