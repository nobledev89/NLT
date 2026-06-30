'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction } from './actions';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ImageField } from '@/components/admin/image-field';
import { slugify } from '@/lib/utils';
import type { PostRow, PostCategoryRow } from '@/types/database';
import type { PostStatus } from '@/types/database';

interface PostFormProps {
  post?: PostRow | null;
  categories: PostCategoryRow[];
  assignedCategoryIds?: string[];
}

export function PostForm({ post, categories, assignedCategoryIds = [] }: PostFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(savePostAction, initialActionState);

  const [title, setTitle] = React.useState(post?.title ?? '');
  const [slug, setSlug] = React.useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!post);
  const [status, setStatus] = React.useState<PostStatus>(post?.status ?? 'draft');
  const [commentsEnabled, setCommentsEnabled] = React.useState(post?.comments_enabled ?? false);
  const [isFeatured, setIsFeatured] = React.useState(post?.is_featured ?? false);
  const [selectedCats, setSelectedCats] = React.useState<Set<string>>(
    new Set(assignedCategoryIds)
  );

  React.useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  function onTitleBlur() {
    if (!slugTouched && title) setSlug(slugify(title));
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const fe = state.fieldErrors ?? {};

  // datetime-local needs "YYYY-MM-DDTHH:mm"
  const scheduledDefault = post?.scheduled_for
    ? new Date(post.scheduled_for).toISOString().slice(0, 16)
    : '';

  return (
    <form action={formAction} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="commentsEnabled" value={String(commentsEnabled)} />
      <input type="hidden" name="isFeatured" value={String(isFeatured)} />
      {[...selectedCats].map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}

      {state.message && <FormMessage ok={state.ok} message={state.message} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Field label="Title" error={fe.title} required>
                <Input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={onTitleBlur}
                  placeholder="Post title"
                />
              </Field>
              <Field label="Slug" error={fe.slug} hint="The URL path: /blog/your-slug" required>
                <Input
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder="post-slug"
                />
              </Field>
              <Field label="Excerpt" error={fe.excerpt} hint="A short summary shown in listings.">
                <Textarea name="excerpt" defaultValue={post?.excerpt ?? ''} rows={3} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 py-6">
              <Field label="Content" error={fe.contentHtml}>
                <RichTextEditor
                  name="contentHtml"
                  defaultValue={post?.content_html ?? ''}
                  placeholder="Write your post…"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-6">
              <h3 className="text-sm font-semibold">SEO</h3>
              <Field label="SEO title" error={fe.seoTitle} hint="Up to 70 characters.">
                <Input name="seoTitle" defaultValue={post?.seo_title ?? ''} maxLength={70} />
              </Field>
              <Field
                label="SEO description"
                error={fe.seoDescription}
                hint="Up to 180 characters."
              >
                <Textarea
                  name="seoDescription"
                  defaultValue={post?.seo_description ?? ''}
                  rows={2}
                  maxLength={180}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Field label="Status" error={fe.status}>
                <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {status === 'scheduled' && (
                <Field label="Publish at" error={fe.scheduledFor}>
                  <Input
                    type="datetime-local"
                    name="scheduledFor"
                    defaultValue={scheduledDefault}
                  />
                </Field>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm">Allow comments</label>
                <Switch checked={commentsEnabled} onCheckedChange={setCommentsEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">Featured post</label>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-6">
              <ImageField name="featuredImageUrl" label="Featured image" defaultValue={post?.featured_image_url ?? ''} />
              {fe.featuredImageUrl && <p className="text-xs text-red-400">{fe.featuredImageUrl}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-6">
              <h3 className="text-sm font-semibold">Categories</h3>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedCats.has(cat.id)}
                        onCheckedChange={() => toggleCat(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <SubmitButton pendingText="Saving…">{post ? 'Save post' : 'Create post'}</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
