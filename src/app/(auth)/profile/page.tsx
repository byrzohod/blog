'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().url().optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (session?.user) {
      reset({
        name: session.user.name || '',
        image: session.user.image || '',
      });
    }
  }, [session, status, router, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError('root', { message: result.error || 'Failed to update profile' });
        return;
      }

      // Update the session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          image: data.image || session?.user?.image,
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('root', { message: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container-prose py-12">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-subtle text-sm">
              <User className="h-4 w-4" />
              <span className="capitalize">{session.user.role?.toLowerCase()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="p-3 rounded-md bg-error/10 text-error text-sm">
                  {errors.root.message}
                </div>
              )}

              {saved && (
                <div className="p-3 rounded-md bg-success/10 text-success text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Profile updated successfully
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-foreground-muted" />
                  <Input
                    id="email"
                    value={session.user.email || ''}
                    disabled
                    className="bg-background-subtle"
                  />
                </div>
                <p className="text-xs text-foreground-muted">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-error">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Profile Image URL</Label>
                <Input
                  id="image"
                  placeholder="https://..."
                  {...register('image')}
                />
                {errors.image && (
                  <p className="text-sm text-error">{errors.image.message}</p>
                )}
                <p className="text-xs text-foreground-muted">
                  Enter a URL to your profile picture
                </p>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
