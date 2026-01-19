import Link from "next/link";
import Image from "next/image";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featuredImage: string | null;
    publishedAt: Date | null;
    author: {
      name: string | null;
      image: string | null;
    };
    category: {
      name: string;
      slug: string;
    } | null;
  };
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const readingTime = calculateReadingTime(post.content);

  if (featured) {
    return (
      <Card className="overflow-hidden gradient-border matrix-border hover:shadow-[0_0_30px_hsl(var(--glow-green)/0.2)] transition-all duration-300">
        <Link href={`/blog/${post.slug}`} className="block">
          {post.featuredImage && (
            <div className="relative aspect-[2/1] overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}
          <CardHeader className="space-y-4">
            {post.category && (
              <Badge
                variant="secondary"
                className="w-fit bg-accent-muted/50 text-accent-hover border-accent/30"
              >
                {post.category.name}
              </Badge>
            )}
            <h2 className="text-2xl font-semibold leading-tight hover:text-accent transition-colors gradient-text">
              {post.title}
            </h2>
          </CardHeader>
          <CardContent>
            {post.excerpt && (
              <p className="text-foreground-muted line-clamp-3 text-sm leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={post.author.image || undefined}
                  alt={post.author.name || ""}
                />
                <AvatarFallback className="text-xs">
                  {post.author.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              <span>{readingTime} min read</span>
            </div>
          </CardFooter>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden matrix-border hover:shadow-[0_0_20px_hsl(var(--glow-green)/0.2)] transition-all duration-300 group">
      <Link href={`/blog/${post.slug}`} className="flex flex-col sm:flex-row">
        {post.featuredImage && (
          <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-col flex-1 p-4">
          {post.category && (
            <Badge
              variant="secondary"
              className="w-fit mb-2 text-xs bg-accent-muted/30 text-accent-hover border-accent/20"
            >
              {post.category.name}
            </Badge>
          )}
          <h3 className="font-semibold text-lg leading-tight mb-2 hover:text-accent transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-foreground-muted text-sm line-clamp-2 mb-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between text-xs text-foreground-muted">
            <span>{post.author.name}</span>
            <div className="flex items-center gap-2">
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              <span>{readingTime} min</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
