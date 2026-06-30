'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { saveCategoryAction, deleteCategoryAction } from '../actions';
import { initialActionState } from '@/lib/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/forms/submit-button';
import { FormMessage } from '@/components/forms/field';
import type { PostCategoryRow } from '@/types/database';

export function CategoryManager({ categories }: { categories: PostCategoryRow[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveCategoryAction, initialActionState);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  async function remove(id: string) {
    if (!window.confirm('Delete this category?')) return;
    setBusyId(id);
    await deleteCategoryAction(id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="flex items-start gap-2">
        <div className="flex-1">
          <Input name="name" placeholder="New category name" />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.name}</p>
          )}
        </div>
        <SubmitButton pendingText="Adding…">
          <Plus className="h-4 w-4" /> Add
        </SubmitButton>
      </form>

      {state.message && !state.ok && <FormMessage ok={false} message={state.message} />}

      {categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                disabled={busyId === cat.id}
                onClick={() => remove(cat.id)}
              >
                {busyId === cat.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
