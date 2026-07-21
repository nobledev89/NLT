'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { submitCommentAction } from '@/app/actions/public-forms';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

export interface DisplayComment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
}

export function CommentSection({
  postId,
  postSlug,
  isSignedIn,
  comments,
}: {
  postId: string;
  postSlug: string;
  isSignedIn: boolean;
  comments: DisplayComment[];
}) {
  const [state, action] = useActionState(submitCommentAction, initialActionState);

  return (
    <section className="mt-12 border-t border-border/60 pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-2xl font-serif font-medium">
        Conversation
      </h2>

      {/* Form */}
      <div className="mt-6">
        {isSignedIn ? (
          state.ok ? (
            <FormMessage ok message={state.message} />
          ) : (
            <form action={action} className="space-y-3">
              <input type="hidden" name="postId" value={postId} />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="absolute left-[-9999px]"
                aria-hidden
              />
              <FormMessage ok={state.ok} message={state.message} />
              <Field label="Add a comment" htmlFor="body" error={state.fieldErrors?.body}>
                <Textarea
                  id="body"
                  name="body"
                  required
                  minLength={2}
                  placeholder="Share an encouraging thought…"
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Comments are reviewed before they appear.
              </p>
              <SubmitButton pendingText="Posting…">Post comment</SubmitButton>
            </form>
          )
        ) : (
          <p className="rounded-xl border border-border bg-card/50 p-5 text-sm text-muted-foreground">
            <Link
              href={`/login?redirect=/posts/${postSlug}`}
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to join the conversation.
          </p>
        )}
      </div>

      {/* Approved comments */}
      <ul className="mt-8 space-y-5">
        {comments.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No comments yet. Be the first to share.
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium">{c.authorName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {c.body}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
