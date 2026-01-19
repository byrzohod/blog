import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import { getRelatedPosts } from "@/lib/related-posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RelatedPosts } from "@/components/blog/related-posts";

// Force dynamic generation to avoid build-time database access
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.post.findUnique({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: {
        lte: new Date(),
      },
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.metaDescription || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.metaDescription || undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.metaDescription || undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts({
    postId: post.id,
    categoryId: post.categoryId,
    tagIds: post.tags.map((t) => t.id),
  });
  const readingTime = calculateReadingTime(post.content);

  return (
    <article className="py-12">
      {/* Back Link */}
      <div className="container-wide mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      {/* Header */}
      <header className="container-prose mb-12">
        {post.category && (
          <Link href={`/blog/category/${post.category.slug}`}>
            <Badge variant="secondary" className="mb-4">
              {post.category.name}
            </Badge>
          </Link>
        )}

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-foreground-muted mb-8">{post.excerpt}</p>
        )}

        {/* Author & Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.author.image || undefined}
                alt={post.author.name || ""}
              />
              <AvatarFallback>
                {post.author.name?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {post.author.name}
            </span>
          </div>

          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="container-wide mb-12">
          <div className="relative aspect-[2/1] rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container-prose">
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-foreground-muted" />
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Posts */}
      <div className="container-wide">
        <RelatedPosts posts={relatedPosts} />
      </div>
    </article>
  );
}
