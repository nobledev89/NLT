'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Trash2, Pencil, Copy, Check } from 'lucide-react';
import { uploadMedia, updateMediaMeta, deleteMedia } from '@/app/actions/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Field } from '@/components/forms/field';
import { formatDate } from '@/lib/utils';
import type { MediaAssetRow } from '@/types/database';

export function MediaManager({ assets }: { assets: MediaAssetRow[] }) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<MediaAssetRow | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadMedia(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (!res.ok) {
      setError(res.message ?? 'Upload failed');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this image? This cannot be undone.')) return;
    const res = await deleteMedia(id);
    if (!res.ok) {
      setError(res.message ?? 'Delete failed');
      return;
    }
    router.refresh();
  }

  async function copyUrl(asset: MediaAssetRow) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId((c) => (c === asset.id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, GIF or SVG up to 10 MB.</p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
          No media yet. Upload your first image to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-brand/40"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={asset.url}
                  alt={asset.alt_text ?? asset.file_name}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-xs font-medium" title={asset.file_name}>
                  {asset.file_name}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={asset.alt_text ?? ''}>
                  {asset.alt_text ? asset.alt_text : <span className="italic">No alt text</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">{formatDate(asset.created_at)}</p>
                <div className="flex items-center gap-1 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setEditing(asset)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => copyUrl(asset)}
                  >
                    {copiedId === asset.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditDialog
        asset={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function EditDialog({
  asset,
  onClose,
  onSaved,
}: {
  asset: MediaAssetRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alt, setAlt] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (asset) {
      setAlt(asset.alt_text ?? '');
      setCaption(asset.caption ?? '');
      setErr(null);
    }
  }, [asset]);

  async function save() {
    if (!asset) return;
    setSaving(true);
    setErr(null);
    const res = await updateMediaMeta(asset.id, alt, caption);
    setSaving(false);
    if (!res.ok) {
      setErr(res.message ?? 'Save failed');
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit image details</DialogTitle>
        </DialogHeader>
        {asset && (
          <div className="space-y-4">
            <div className="relative h-40 w-full overflow-hidden rounded-md border border-border bg-muted">
              <Image src={asset.url} alt={alt || asset.file_name} fill className="object-contain" />
            </div>
            <Field label="Alt text" hint="Describe the image for screen readers and SEO.">
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Worship team on stage" />
            </Field>
            <Field label="Caption">
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" />
            </Field>
            {err && <p className="text-sm text-red-400">{err}</p>}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
