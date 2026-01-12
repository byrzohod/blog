# Phase 2: Authentication Implementation

**Status:** Not Started
**Priority:** High
**Dependencies:** Phase 1 (Foundation)
**Estimated Tasks:** 14

---

## Overview

Implement secure authentication using NextAuth.js (Auth.js) with email/password and Google OAuth providers. This phase establishes user accounts, roles, and protected routes.

---

## Goals

1. Set up NextAuth.js with Prisma adapter
2. Implement email/password registration and login
3. Add Google OAuth authentication
4. Create role-based access control (ADMIN, AUTHOR, SUBSCRIBER)
5. Protect admin routes with middleware

---

## Tasks

### 2.1 Install and Configure NextAuth.js

```bash
npm install next-auth @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

**File:** `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
```

**Acceptance Criteria:**
- [ ] NextAuth configured with Prisma adapter
- [ ] JWT session strategy enabled
- [ ] Custom sign-in pages specified
- [ ] Callbacks extend session with role

---

### 2.2 Set Up Prisma Adapter Schema

**File:** `prisma/schema.prisma` (update)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          Role      @default(SUBSCRIBER)
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  comments      Comment[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

enum Role {
  ADMIN
  AUTHOR
  SUBSCRIBER
}
```

Run migration:
```bash
npx prisma migrate dev --name add_auth_tables
```

**Acceptance Criteria:**
- [ ] Account, Session, VerificationToken models created
- [ ] User model has relations to accounts/sessions
- [ ] Migration runs successfully

---

### 2.3 Create Type Definitions

**File:** `src/types/next-auth.d.ts`

```typescript
import { Role } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
```

**Acceptance Criteria:**
- [ ] TypeScript knows about custom user properties
- [ ] Role type properly extended
- [ ] No type errors in auth code

---

### 2.4 Create API Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Acceptance Criteria:**
- [ ] Auth endpoints respond correctly
- [ ] `/api/auth/signin` accessible
- [ ] `/api/auth/signout` works

---

### 2.5 Create Registration Page

**File:** `src/app/(auth)/register/page.tsx`

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Register',
};

export default function RegisterPage() {
  return (
    <div className="container-wide flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-foreground-muted mt-2">
            Join the community and start engaging
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-foreground-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**File:** `src/components/auth/register-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-error/10 text-error p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-error text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-error text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-error text-sm">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-error text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Form validates all fields
- [ ] Passwords must match
- [ ] Error messages display correctly
- [ ] Success redirects to login

---

### 2.6 Create Registration API Endpoint

**File:** `src/app/api/auth/register/route.ts`

```typescript
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Validates input with Zod
- [ ] Checks for existing email
- [ ] Hashes password with bcrypt
- [ ] Returns appropriate error messages

---

### 2.7 Create Login Page

**File:** `src/app/(auth)/login/page.tsx`

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <div className="container-wide flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-foreground-muted mt-2">
            Sign in to your account
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-foreground-muted">
          Don't have an account?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**File:** `src/components/auth/login-form.tsx` (similar structure to register form)

**Acceptance Criteria:**
- [ ] Email/password login works
- [ ] Google OAuth button present
- [ ] Error handling for invalid credentials
- [ ] Redirect after successful login

---

### 2.8 Add Google OAuth Provider

Ensure Google provider is configured in `src/lib/auth.ts` (already done in 2.1).

**Setup steps:**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add client ID and secret to `.env`

**File:** Add Google button to login form:

```typescript
import { signIn } from 'next-auth/react';

<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={() => signIn('google', { callbackUrl: '/' })}
>
  <GoogleIcon className="mr-2 h-4 w-4" />
  Continue with Google
</Button>
```

**Acceptance Criteria:**
- [ ] Google sign-in button visible
- [ ] OAuth flow completes successfully
- [ ] User created/linked in database
- [ ] Redirect to home after success

---

### 2.9 Create Auth Middleware

**File:** `src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Check admin routes
    if (isAdminRoute) {
      if (!token || (token.role !== 'ADMIN' && token.role !== 'AUTHOR')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

        if (isAdminRoute) {
          return !!token && (token.role === 'ADMIN' || token.role === 'AUTHOR');
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Acceptance Criteria:**
- [ ] Admin routes require authentication
- [ ] Non-admin/author users redirected
- [ ] Public routes remain accessible

---

### 2.10 Create Session Provider

**File:** `src/components/auth/session-provider.tsx`

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

Update `src/app/layout.tsx` to wrap with SessionProvider.

**Acceptance Criteria:**
- [ ] Session available in client components
- [ ] `useSession` hook works

---

### 2.11 Create User Menu Component

**File:** `src/components/auth/user-menu.tsx`

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-8 rounded-full bg-background-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-foreground-muted">{session.user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        {(session.user.role === 'ADMIN' || session.user.role === 'AUTHOR') && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Dashboard</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows login/signup when logged out
- [ ] Shows avatar dropdown when logged in
- [ ] Admin link visible for admin/author
- [ ] Sign out works correctly

---

### 2.12 Create User Profile Page

**File:** `src/app/(auth)/profile/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProfileForm } from '@/components/auth/profile-form';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container-wide py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        <ProfileForm user={session.user} />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Protected route (redirects if not logged in)
- [ ] Shows user information
- [ ] Can update name and avatar
- [ ] Password change option

---

### 2.13 Implement Role-Based Access Control

Create helper functions for checking permissions.

**File:** `src/lib/auth-utils.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export function canEditPost(userId: string, postAuthorId: string, userRole: Role) {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'AUTHOR' && userId === postAuthorId) return true;
  return false;
}

export function canModerateComments(userRole: Role) {
  return userRole === 'ADMIN' || userRole === 'AUTHOR';
}
```

**Acceptance Criteria:**
- [ ] Helper functions work correctly
- [ ] Role checks are reusable
- [ ] TypeScript types are correct

---

### 2.14 Add Email Verification (Optional)

For enhanced security, implement email verification.

**Steps:**
1. Add `emailVerified` field usage
2. Create verification token on registration
3. Send verification email
4. Create verify endpoint

This can be deferred to Phase 7 (Subscriptions) when email is set up.

**Acceptance Criteria:**
- [ ] Verification email sent on registration
- [ ] Token validates correctly
- [ ] User marked as verified

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/auth.ts` | Created | NextAuth configuration |
| `src/lib/auth-utils.ts` | Created | Auth helper functions |
| `prisma/schema.prisma` | Modified | Auth models |
| `src/types/next-auth.d.ts` | Created | Type extensions |
| `src/app/api/auth/[...nextauth]/route.ts` | Created | Auth API routes |
| `src/app/api/auth/register/route.ts` | Created | Registration endpoint |
| `src/app/(auth)/login/page.tsx` | Created | Login page |
| `src/app/(auth)/register/page.tsx` | Created | Registration page |
| `src/app/(auth)/profile/page.tsx` | Created | Profile page |
| `src/components/auth/*.tsx` | Created | Auth components |
| `src/middleware.ts` | Created | Route protection |

---

## Dependencies

```json
{
  "dependencies": {
    "next-auth": "^4.x",
    "@auth/prisma-adapter": "^1.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.x"
  }
}
```

---

## Testing Checklist

- [ ] Registration creates user in database
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials fails
- [ ] Google OAuth creates/links user
- [ ] Session persists across page loads
- [ ] Admin routes protected
- [ ] Non-admin users cannot access admin
- [ ] Sign out clears session
- [ ] Profile page shows correct user

---

## Security Considerations

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens for stateless sessions
- CSRF protection via NextAuth
- Rate limiting recommended for production
- Secure cookie settings in production
