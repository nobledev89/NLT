import { cn } from '@/lib/utils';

/** Compact hero header for data-driven public pages (Services, Events, etc.). */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/30 via-background to-background" />
      <div className="absolute inset-0 -z-10 bg-grain" />
      <div className="container py-20 md:py-28">
        <div className={cn('max-w-3xl space-y-4', align === 'center' && 'mx-auto text-center')}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="text-display font-serif font-medium">{title}</h1>
          {subtitle && <p className="text-lg leading-relaxed text-foreground/70">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
