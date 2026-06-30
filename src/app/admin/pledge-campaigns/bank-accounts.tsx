'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { BankAccountRow } from '@/types/database';
import {
  saveBankAccountAction,
  deleteBankAccountAction,
  toggleBankActiveAction,
} from './actions';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageField } from '@/components/admin/image-field';

function BankAccountDialog({ account }: { account?: BankAccountRow }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState(saveBankAccountAction, initialActionState);
  const [active, setActive] = React.useState(account?.active ?? true);
  const fe = state.fieldErrors ?? {};
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    if (open) wasOpen.current = true;
  }, [open]);

  React.useEffect(() => {
    if (state.ok && wasOpen.current) {
      setOpen(false);
      wasOpen.current = false;
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {account ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" /> Add bank account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit bank account' : 'Add bank account'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {account && <input type="hidden" name="id" value={account.id} />}
          <FormMessage ok={state.ok} message={state.message} />
          <Field label="Bank name" htmlFor="bank_name" required error={fe.bank_name}>
            <Input id="bank_name" name="bank_name" defaultValue={account?.bank_name ?? ''} required />
          </Field>
          <Field label="Account name" htmlFor="account_name" required error={fe.account_name}>
            <Input id="account_name" name="account_name" defaultValue={account?.account_name ?? ''} required />
          </Field>
          <Field label="Account number" htmlFor="account_number" required error={fe.account_number}>
            <Input id="account_number" name="account_number" defaultValue={account?.account_number ?? ''} required />
          </Field>
          <Field label="Instructions" htmlFor="instructions">
            <Textarea
              id="instructions"
              name="instructions"
              defaultValue={account?.instructions ?? ''}
              placeholder="e.g. Please send your deposit slip after transferring."
            />
          </Field>
          <ImageField name="qr_image_url" label="QR code image" defaultValue={account?.qr_image_url ?? ''} />
          <Field label="Position" htmlFor="position" hint="Lower numbers show first.">
            <Input id="position" name="position" type="number" min={0} defaultValue={account?.position ?? 0} />
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5">
            <Label htmlFor="active">Active</Label>
            <input type="hidden" name="active" value={active ? 'true' : 'false'} />
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex justify-end gap-2">
            <SubmitButton pendingText="Saving…">{account ? 'Save changes' : 'Add account'}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBankButton({ id }: { id: string }) {
  const [, action] = useActionState(deleteBankAccountAction, initialActionState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this bank account?')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </form>
  );
}

function ToggleActive({ account }: { account: BankAccountRow }) {
  const [, action] = useActionState(toggleBankActiveAction, initialActionState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={account.id} />
      <input type="hidden" name="active" value={account.active ? 'false' : 'true'} />
      <Button type="submit" variant="ghost" size="sm">
        {account.active ? 'Deactivate' : 'Activate'}
      </Button>
    </form>
  );
}

export function BankAccountsSection({ accounts }: { accounts: BankAccountRow[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bank accounts</h2>
          <p className="text-sm text-muted-foreground">Deposit details shown on pledge pages.</p>
        </div>
        <BankAccountDialog />
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-md border border-border py-10 text-center text-sm text-muted-foreground">
          No bank accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Bank</th>
                <th className="px-4 py-2 font-medium">Account name</th>
                <th className="px-4 py-2 font-medium">Account number</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Position</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-2">
                      {a.bank_name}
                      {a.is_placeholder && <Badge variant="warning">Placeholder</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{a.account_name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{a.account_number}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={a.active ? 'success' : 'muted'}>{a.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{a.position}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <ToggleActive account={a} />
                      <BankAccountDialog account={a} />
                      <DeleteBankButton id={a.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
