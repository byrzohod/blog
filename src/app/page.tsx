import Link from 'next/link';
import { ArrowRight, BookOpen, Rss, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden star-field">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-[hsl(var(--glow-purple))] rounded-full blur-[128px] opacity-20 animate-float" />
        <div className="absolute bottom-20 -right-32 w-96 h-96 bg-[hsl(var(--glow-cyan))] rounded-full blur-[128px] opacity-15 animate-float" style={{ animationDelay: '-3s' }} />

        <div className="container-wide py-24 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to my
              <span className="gradient-text block">Book of Life</span>
            </h1>
            <p className="mt-6 text-lg text-foreground-muted leading-relaxed max-w-2xl">
              A personal chronicle of thoughts, experiences, and stories.
              Here I share my journey, ideas, and reflections on life, technology,
              and everything in between.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="gradient">
                <Link href="/blog">
                  Read the Blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">
                  About Me
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/50 bg-background-subtle">
        <div className="container-wide py-16 md:py-24">
          <h2 className="text-2xl font-bold text-center mb-12">What You'll Find Here</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover-glow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start)/0.2)] to-[hsl(var(--gradient-end)/0.2)] text-accent mb-4 group-hover:shadow-[0_0_20px_hsl(var(--glow-purple)/0.4)] transition-all duration-300">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Personal Stories</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">
                Authentic experiences and lessons learned through life's journey.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover-glow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start)/0.2)] to-[hsl(var(--gradient-end)/0.2)] text-accent mb-4 group-hover:shadow-[0_0_20px_hsl(var(--glow-cyan)/0.4)] transition-all duration-300">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Thoughtful Discussions</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">
                Join the conversation and share your perspectives in the comments.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover-glow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start)/0.2)] to-[hsl(var(--gradient-end)/0.2)] text-accent mb-4 group-hover:shadow-[0_0_20px_hsl(var(--glow-purple)/0.4)] transition-all duration-300">
                <Rss className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Stay Connected</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">
                Subscribe via RSS or email to never miss a new post.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts Section - Placeholder */}
      <section className="border-t border-border/50">
        <div className="container-wide py-16 md:py-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Recent Posts</h2>
            <Link
              href="/blog"
              className="text-sm text-accent hover:text-accent-hover transition-all duration-200 inline-flex items-center gap-1 hover:gap-2"
            >
              View all posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="text-center py-12 text-foreground-muted rounded-xl border border-border/30 bg-background-subtle/50">
            <p>No posts yet. Check back soon!</p>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="border-t border-border/50 bg-background-subtle relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start)/0.05)] to-[hsl(var(--gradient-end)/0.05)]" />

        <div className="container-wide py-16 md:py-24 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-foreground-muted mb-8">
              Subscribe to receive notifications when new posts are published.
              No spam, unsubscribe anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="gradient">
                <Link href="/subscribe">
                  Subscribe via Email
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/feed.xml">
                  <Rss className="mr-2 h-4 w-4" />
                  RSS Feed
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
