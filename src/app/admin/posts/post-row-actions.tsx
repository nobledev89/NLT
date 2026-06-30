'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { deletePostAction, togglePostStatusAction } from './actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { PostStatus } from '@/types/database';

export function PostRowActions({ id, status }: { id: string; status: PostStatus }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function setStatus(next: PostStatus) {
    setBusy(true);
    await togglePostStatusAction(id, next);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm('Delete this post? It will be moved to trash.')) return;
    setBusy(true);
    await deletePostAction(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/posts/${id}`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        {status !== 'published' ? (
          <DropdownMenuItem onClick={() => setStatus('published')}>
            <Eye className="h-4 w-4" /> Publish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => setStatus('draft')}>
            <EyeOff className="h-4 w-4" /> Unpublish
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={remove}>
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
