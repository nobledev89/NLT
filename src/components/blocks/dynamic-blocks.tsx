import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  EventCard,
  PostCard,
  MinistryCard,
  ScheduleList,
} from '@/components/site/content-cards';
import { formatPHP } from '@/lib/utils';
import type { CollectionData, ScheduleData, PledgeDetailsData } from '@/lib/blocks/types';

function SectionHead({ heading, intro, href, hrefLabel }: { heading?: string; intro?: string; href?: string; hrefLabel?: string }) {
  if (!heading && !intro) return null;
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-xl space-y-2">
        {heading && <h2 className="text-headline font-serif font-medium">{heading}</h2>}
        {intro && <p className="text-foreground/70">{intro}</p>}
      </div>
      {href && (
        <Button asChild variant="link" className="px-0">
          <Link href={href}>{hrefLabel ?? 'View all'}</Link>
        </Button>
      )}
    </div>
  );
}

export async function ScheduleBlock({ data }: { data: ScheduleData }) {
  if (data.manualItems && data.manualItems.length > 0) {
    return (
      <section className="section">
        <div className="container">
          <SectionHead heading={data.heading} intro={data.intro} href="/services" hrefLabel="All services" />
          <div className="mx-auto grid max-w-3xl gap-3">
            {data.manualItems.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-5">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.day}{s.location ? ` · ${s.location}` : ''}</p>
                </div>
                <p className="font-semibold text-brand">{s.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: schedules } = await supabase
    .from('service_schedules')
    .select('*')
    .eq('published', true)
    .eq('is_special', false)
    .order('position');

  return (
    <section className="section">
      <div className="container">
        <SectionHead heading={data.heading ?? 'Service Times'} intro={data.intro} href="/services" hrefLabel="All services" />
        <ScheduleList schedules={schedules ?? []} />
      </div>
    </section>
  );
}

export async function EventListBlock({ data }: { data: CollectionData }) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('is_public', true)
    .gte('start_at', new Date().toISOString())
    .order('start_at')
    .limit(data.limit ?? 3);

  if (!events || events.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <SectionHead heading={data.heading ?? 'Upcoming Events'} intro={data.intro} href="/events" />
          <p className="text-muted-foreground">No upcoming events right now. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <SectionHead heading={data.heading ?? 'Upcoming Events'} intro={data.intro} href="/events" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </div>
    </section>
  );
}

export async function PostListBlock({ data }: { data: CollectionData }) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(data.limit ?? 3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <SectionHead heading={data.heading ?? 'Latest Posts'} intro={data.intro} href="/posts" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  );
}

export async function MinistryCardsBlock({ data }: { data: CollectionData }) {
  const supabase = await createClient();
  const { data: ministries } = await supabase
    .from('ministries')
    .select('*')
    .eq('published', true)
    .order('position')
    .limit(data.limit ?? 6);

  if (!ministries || ministries.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <SectionHead heading={data.heading ?? 'Ministries'} intro={data.intro} href="/ministries" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((m) => <MinistryCard key={m.id} ministry={m} />)}
        </div>
      </div>
    </section>
  );
}

export async function PledgeDetailsBlock({ data }: { data: PledgeDetailsData }) {
  const supabase = await createClient();
  const [{ data: campaigns }, { data: banks }] = await Promise.all([
    data.showCampaigns !== false
      ? supabase.from('pledge_campaigns').select('*').neq('status', 'cancelled').order('position')
      : Promise.resolve({ data: [] as never[] }),
    data.showBankAccounts !== false
      ? supabase.from('bank_accounts').select('*').eq('active', true).order('position')
      : Promise.resolve({ data: [] as never[] }),
  ]);

  return (
    <section className="section">
      <div className="container max-w-4xl space-y-10">
        <SectionHead heading={data.heading ?? 'Giving'} intro={data.intro} />
        {(campaigns ?? []).length > 0 && (
          <div className="space-y-4">
            {(campaigns ?? []).map((c) => (
              <Card key={c.id} className="p-6">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                {c.goal_amount != null && (
                  <p className="mt-1 text-sm text-muted-foreground">Goal: {formatPHP(Number(c.goal_amount))}</p>
                )}
              </Card>
            ))}
          </div>
        )}
        {(banks ?? []).length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {(banks ?? []).map((b) => (
              <Card key={b.id} className="p-6">
                <p className="text-sm text-muted-foreground">{b.bank_name}</p>
                <p className="font-medium">{b.account_name}</p>
                <p className="font-mono text-sm">{b.account_number}</p>
              </Card>
            ))}
          </div>
        )}
        <Button asChild>
          <Link href="/pledge">Make a Pledge</Link>
        </Button>
      </div>
    </section>
  );
}
