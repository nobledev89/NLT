'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { createPageAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Field } from '@/components/forms/field';
import { slugify } from '@/lib/utils';

export function NewPageButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function create() {
    setBusy(true);
    setErr(null);
    const res = await createPageAction(title, slugTouched ? slug : slugify(title));
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.message ?? 'Could not create page.');
      return;
    }
    setOpen(false);
    router.push(`/admin/pages/${res.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New page
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About us"
              autoFocus
            />
          </Field>
          <Field label="Slug" hint={`URL: /${(slugTouched ? slug : slugify(title)) || 'slug'}`} required>
            <Input
              value={slugTouched ? slug : slugify(title)}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="about-us"
            />
          </Field>
          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={create} disabled={busy || title.trim().length < 2}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
