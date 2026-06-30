'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { setPledgeStatusAction } from './actions';
import { initialActionState } from '@/lib/form';
import type { PledgeStatus } from '@/types/database';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const OPTIONS: { value: PledgeStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function PledgeStatusControl({
  id,
  status,
}: {
  id: string;
  status: PledgeStatus;
}) {
  const [, action, pending] = useActionState(setPledgeStatusAction, initialActionState);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <Select
        name="status"
        defaultValue={status}
        disabled={pending}
        onValueChange={() => {
          // submit on next tick so the hidden select value is committed
          requestAnimationFrame(() => formRef.current?.requestSubmit());
        }}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
