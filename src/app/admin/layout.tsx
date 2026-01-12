import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Users,
  Home,
  Tags,
  FolderOpen,
  Mail,
  Activity,
  BarChart3,
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Tags', href: '/admin/tags', icon: Tags },
  { name: 'Media', href: '/admin/media', icon: ImageIcon },
  { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Subscribers', href: '/admin/subscribers', icon: Mail },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR')) {
    redirect('/login?error=unauthorized');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-background-subtle">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Admin Dashboard</h2>
          <p className="text-sm text-foreground-muted">{session.user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'text-foreground-muted hover:text-foreground hover:bg-background-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
