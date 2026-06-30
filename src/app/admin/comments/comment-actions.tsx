'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, EyeOff, Trash2, Undo2 } from 'lucide-react';
import { moderateCommentAction, deleteCommentAction } from './actions';
import { Button } from '@/components/ui/button';
import type { CommentStatus } from '@/types/database';

export function CommentActions({ id, status }: { id: string; status: CommentStatus }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function moderate(next: CommentStatus) {
    setBusy(true);
    await moderateCommentAction(id, next);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm('Permanently delete this comment?')) return;
    setBusy(true);
    await deleteCommentAction(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'approved' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => moderate('approved')}>
          <Check className="h-4 w-4" /> Approve
        </Button>
      )}
      {status !== 'rejected' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => moderate('rejected')}>
          <X className="h-4 w-4" /> Reject
        </Button>
      )}
      {status !== 'hidden' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => moderate('hidden')}>
          <EyeOff className="h-4 w-4" /> Hide
        </Button>
      )}
      {status !== 'pending' && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => moderate('pending')}>
          <Undo2 className="h-4 w-4" /> Reset
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-red-400 hover:text-red-300"
        disabled={busy}
        onClick={remove}
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </div>
  );
}
