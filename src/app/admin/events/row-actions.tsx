'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteEventAction } from './actions';
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

export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState(deleteEventAction, initialActionState);

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
          <DialogTitle>Delete event?</DialogTitle>
          <DialogDescription>
            &ldquo;{title}&rdquo; will be removed from the site. This can be undone in the database.
          </DialogDescription>
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
