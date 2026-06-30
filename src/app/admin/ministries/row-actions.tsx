'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteMinistryAction } from './actions';
import { initialActionState } from '@/lib/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeleteMinistryButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState(deleteMinistryAction, initialActionState);

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete ministry?</DialogTitle>
          <DialogDescription>&ldquo;{name}&rdquo; will be permanently removed.</DialogDescription>
        </DialogHeader>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
