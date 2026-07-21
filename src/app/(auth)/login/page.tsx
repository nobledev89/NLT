import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormMessage } from '@/components/forms/field';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your New Life Tagum account.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormMessage ok={false} message={error} />}
        <LoginForm redirectTo={redirect} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <p>
          <Link href="/forgot-password" className="text-brand hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p>
          New here?{' '}
          <Link href="/register" className="text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
