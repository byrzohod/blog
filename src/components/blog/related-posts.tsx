import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RelatedPost } from '@/lib/related-posts';

interface RelatedPostsProps {
  posts: RelatedPost[];
  title?: string;
}

export function RelatedPosts({ posts, title = 'Related Posts' }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold mb-8">{title}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <RelatedPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: RelatedPost }) {
  return (
    <article className="group flex flex-col bg-background-subtle rounded-lg overflow-hidden border border-border hover:border-accent transition-colors">
      {/* Featured Image */}
      <Link href={`/blog/${post.slug}`} className="relative aspect-video overflow-hidden">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-background-muted flex items-center justify-center">
            <span className="text-4xl opacity-20">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {post.category && (
          <Badge className="absolute top-3 left-3 bg-accent text-white">
            {post.category.name}
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-accent transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-foreground-muted text-sm mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-foreground-muted">
          {post.author.name && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{post.author.name}</span>
            </div>
          )}
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
