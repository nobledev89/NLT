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
import { ForgotForm } from './forgot-form';

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your New Life Tagum account.',
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <p>
          Remembered it?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
