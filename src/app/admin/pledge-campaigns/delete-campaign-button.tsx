'use client';

import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCampaignAction } from './actions';
import { initialActionState } from '@/lib/form';
import { Button } from '@/components/ui/button';

export function DeleteCampaignButton({ id }: { id: string }) {
  const [, action] = useActionState(deleteCampaignAction, initialActionState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this campaign? This cannot be undone.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </form>
  );
}
