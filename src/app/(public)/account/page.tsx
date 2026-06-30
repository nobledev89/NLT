import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/app/actions/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default async function AccountProfilePage() {
  const user = await requireUser('/account');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email</Label>
            <input
              id="account-email"
              type="email"
              value={user.email}
              readOnly
              disabled
              className="flex h-10 w-full cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed here.
            </p>
          </div>

          <Separator />

          <ProfileForm
            defaultValues={{
              fullName: user.profile.full_name ?? '',
              phone: user.profile.phone ?? '',
              bio: user.profile.bio ?? '',
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
