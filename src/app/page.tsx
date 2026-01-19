"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircuitBoard,
  Code2,
  Cpu,
  Layers,
  Terminal,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";

const highlightItems = [
  {
    title: "Deep System Notes",
    description: "Architecture, performance, and the edges of modern stacks.",
    icon: Cpu,
  },
  {
    title: "Build Logs",
    description: "Progress snapshots, design tradeoffs, and shipping rhythms.",
    icon: CircuitBoard,
  },
  {
    title: "Crafted Frontends",
    description: "Interfaces that feel deliberate, minimal, and alive.",
    icon: Code2,
  },
] as const;

const focusAreas = [
  {
    title: "Systems",
    description: "Distributed thinking, reliability, and pragmatic scale.",
  },
  {
    title: "UI Engineering",
    description: "Design systems, typography, and motion with intention.",
  },
  {
    title: "Tools",
    description:
      "Automation, workflows, and the craft of developer experience.",
  },
  {
    title: "Leadership",
    description: "Team rituals, clear thinking, and sustainable shipping.",
  },
] as const;

export default function Home() {
  const glowLeftRef = useRef<HTMLDivElement>(null);
  const glowRightRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLDivElement>(null);

  const revealStyle = useMemo(
    () => (delay: number) =>
      ({
        "--reveal-delay": `${delay}ms`,
      }) as CSSProperties,
    [],
  );

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (gridRef.current) {
          gridRef.current.style.transform = `translate3d(0, ${scrollY * 0.04}px, 0)`;
        }
        if (rainRef.current) {
          rainRef.current.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0)`;
        }
        if (glowLeftRef.current) {
          glowLeftRef.current.style.transform = `translate3d(0, ${scrollY * 0.12}px, 0)`;
        }
        if (glowRightRef.current) {
          glowRightRef.current.style.transform = `translate3d(0, ${scrollY * -0.06}px, 0)`;
        }
        if (glyphRef.current) {
          glyphRef.current.style.transform = `translate3d(0, ${scrollY * 0.18}px, 0)`;
        }
        rafId = null;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          ref={gridRef}
          className="absolute inset-0 matrix-grid opacity-50"
        />
        <div
          ref={rainRef}
          className="absolute inset-0 matrix-rain opacity-60"
        />
        <div className="absolute inset-0 matrix-scanlines pointer-events-none" />
        <div
          ref={glowLeftRef}
          className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[hsl(var(--glow-green)/0.18)] blur-[140px]"
        />
        <div
          ref={glowRightRef}
          className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[hsl(var(--glow-teal)/0.2)] blur-[160px]"
        />
        <div
          ref={glyphRef}
          className="absolute right-[10%] top-24 hidden lg:block rounded-2xl border border-accent/20 bg-background/60 px-6 py-4 text-xs text-foreground-muted backdrop-blur"
        >
          <div className="flex items-center gap-2 text-foreground">
            <Terminal className="h-4 w-4 text-accent" />
            root@book-of-life
          </div>
          <div className="mt-3 space-y-1 font-mono">
            <p>init: session::boot</p>
            <p>sync: posts::ready</p>
            <p>signal: inspiration::stable</p>
          </div>
        </div>

        <div className="container-wide relative z-10 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-background/70 px-4 py-1 text-xs text-foreground-muted matrix-glow">
              <Activity className="h-3.5 w-3.5 text-accent" />
              <span>system.online</span>
              <span className="text-foreground-subtle">uptime 99.99%</span>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-foreground-subtle">
              root@book-of-life:~$
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Book of Life
              <span className="gradient-text block">Coder&apos;s Logbook</span>
            </h1>
            <p className="mt-6 text-lg text-foreground-muted leading-relaxed max-w-2xl">
              Field notes from shipping software, building systems, and keeping
              the creative signal clean.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="gradient">
                <Link href="/blog">
                  Enter the Blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#latest">Latest Logs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background-subtle">
        <div className="container-wide py-16 md:py-24">
          <div className="max-w-2xl scroll-reveal" style={revealStyle(0)}>
            <p className="text-xs uppercase tracking-[0.35em] text-foreground-subtle">
              Signal Highlights
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              What&apos;s inside the stack
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlightItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-background/70 p-6 backdrop-blur matrix-border scroll-reveal"
                  style={revealStyle(120 + index * 120)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-background-muted text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-foreground-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="latest" className="border-t border-border/60">
        <div className="container-wide py-16 md:py-24">
          <div
            className="flex flex-wrap items-center justify-between gap-4 scroll-reveal"
            style={revealStyle(0)}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-foreground-subtle">
                Latest Logs
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Recent transmissions
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-sm text-accent hover:text-accent-hover transition-all duration-200 inline-flex items-center gap-1 hover:gap-2"
            >
              View all posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            className="mt-10 rounded-2xl border border-border/60 bg-background-subtle/70 p-10 text-center text-foreground-muted matrix-border scroll-reveal"
            style={revealStyle(160)}
          >
            <p>No posts yet. Boot sequence is still warming up.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background-subtle">
        <div className="container-wide py-16 md:py-24">
          <div className="max-w-2xl scroll-reveal" style={revealStyle(0)}>
            <p className="text-xs uppercase tracking-[0.35em] text-foreground-subtle">
              Focus Areas
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Where the signal stays sharp
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {focusAreas.map((area, index) => (
              <div
                key={area.title}
                className="rounded-2xl border border-border/60 bg-background/70 p-6 matrix-border scroll-reveal"
                style={revealStyle(120 + index * 100)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{area.title}</h3>
                  <Layers className="h-4 w-4 text-foreground-subtle" />
                </div>
                <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container-wide py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div
              className="rounded-2xl border border-border/60 bg-background-subtle/70 p-8 matrix-border scroll-reveal"
              style={revealStyle(0)}
            >
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <CircuitBoard className="h-4 w-4 text-accent" />
                System Snapshot
              </div>
              <h3 className="mt-4 text-2xl font-semibold">Operational focus</h3>
              <div className="mt-6 space-y-3 text-sm text-foreground-muted">
                <p>Stack: Next.js 16, React 19, Prisma, Tailwind v4.</p>
                <p>Intent: ship clean, readable, production-ready systems.</p>
                <p>
                  Status: collecting lessons, patterns, and hard-earned fixes.
                </p>
              </div>
            </div>
            <div
              className="rounded-2xl border border-border/60 bg-background/70 p-8 matrix-border scroll-reveal"
              style={revealStyle(160)}
            >
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Cpu className="h-4 w-4 text-accent" />
                Fast Access
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Navigate the archive
              </h3>
              <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                Jump straight into the full feed and follow the latest coding
                narratives.
              </p>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-6 w-full"
              >
                <Link href="/blog">
                  Browse the Blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
