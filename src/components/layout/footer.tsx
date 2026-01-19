import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-subtle">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Book of Life</h3>
            <p className="text-foreground-muted text-sm leading-relaxed">
              A personal chronicle of thoughts, experiences, and stories.
              Welcome to my corner of the internet.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/feed.xml"
                  className="text-foreground-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Rss className="h-3 w-3" />
                  RSS Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div>
            <h4 className="font-semibold mb-4">Status</h4>
            <p className="text-foreground-muted text-sm mb-4">
              Independent blog focused on systems, UI, and build craft.
            </p>
            <p className="text-sm text-foreground-subtle">
              Signal stable. Logs updated weekly.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground-muted">
            © {currentYear} Sarkis Haralampiev. All rights reserved.
          </p>
          <p className="text-sm text-foreground-subtle">
            Built with Next.js, Tailwind CSS, and PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
}
