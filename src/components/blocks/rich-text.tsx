import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn('prose-church', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
