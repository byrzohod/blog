import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SkipLink } from '@/components/layout/skip-link';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const merriweather = Merriweather({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Book of Life | Sarkis Haralampiev',
    template: '%s | Book of Life',
  },
  description: 'A personal chronicle of thoughts, experiences, and stories. Welcome to my corner of the internet.',
  keywords: ['blog', 'personal', 'thoughts', 'articles', 'Sarkis Haralampiev'],
  authors: [{ name: 'Sarkis Haralampiev' }],
  creator: 'Sarkis Haralampiev',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bookoflife.com',
    siteName: 'Book of Life',
    title: 'Book of Life | Sarkis Haralampiev',
    description: 'A personal chronicle of thoughts, experiences, and stories.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book of Life | Sarkis Haralampiev',
    description: 'A personal chronicle of thoughts, experiences, and stories.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} font-sans antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <SkipLink />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
