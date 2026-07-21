'use client';

import * as React from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadMedia } from '@/app/actions/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/forms/field';

interface MediaItem {
  id: string;
  url: string;
  file_name: string;
  alt_text: string | null;
}

/**
 * Image picker that stores the selected public URL in a hidden input (`name`).
 * Lets the user pick from the media library or upload a new image inline.
 */
export function ImageField({
  name,
  label = 'Image',
  defaultValue = '',
}: {
  name: string;
  label?: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('media_assets')
      .select('id, url, file_name, alt_text')
      .order('created_at', { ascending: false })
      .limit(60);
    setItems((data as MediaItem[]) ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadMedia(fd);
    setUploading(false);
    if (!res.ok || !res.asset) {
      setError(res.message ?? 'Upload failed');
      return;
    }
    setUrl(res.asset.url);
    setOpen(false);
  }

  return (
    <Field label={label}>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-32 overflow-hidden rounded-md border border-border bg-muted">
          {url ? (
            <Image src={url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <ImagePlus className="h-4 w-4" /> Choose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Media library</DialogTitle>
                </DialogHeader>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload new
                    <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No media yet. Upload an image to begin.</p>
                ) : (
                  <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                    {items.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setUrl(m.url);
                          setOpen(false);
                        }}
                        className="relative aspect-square overflow-hidden rounded-md border border-border hover:border-brand"
                      >
                        <Image src={m.url} alt={m.alt_text ?? m.file_name} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {url && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setUrl('')}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-72"
          />
        </div>
      </div>
    </Field>
  );
}
