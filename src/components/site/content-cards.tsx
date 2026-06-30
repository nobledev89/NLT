import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatDateTime, formatTime, truncate } from '@/lib/utils';
import type {
  EventRow,
  PostRow,
  MinistryRow,
  ServiceScheduleRow,
  PledgeCampaignRow,
} from '@/types/database';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link href={`/events/${event.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-colors group-hover:border-gold/40">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-background">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {event.is_featured && <Badge className="absolute left-3 top-3">Featured</Badge>}
        </div>
        <div className="space-y-2 p-5">
          {event.category && <p className="eyebrow">{event.category}</p>}
          <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-gold" /> {formatDateTime(event.start_at)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-gold" /> {event.venue}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function PostCard({ post, featured = false }: { post: PostRow; featured?: boolean }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group">
      <Card className={`h-full overflow-hidden transition-colors group-hover:border-gold/40 ${featured ? 'lg:flex' : ''}`}>
        <div className={`relative overflow-hidden bg-muted ${featured ? 'aspect-[16/10] lg:aspect-auto lg:w-1/2' : 'aspect-[16/10]'}`}>
          {post.featured_image_url ? (
            <Image src={post.featured_image_url} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full min-h-[12rem] items-center justify-center bg-gradient-to-br from-secondary to-background text-muted-foreground">
              <span className="font-serif text-3xl opacity-40">NL</span>
            </div>
          )}
        </div>
        <div className={`space-y-3 p-6 ${featured ? 'lg:w-1/2 lg:self-center' : ''}`}>
          <p className="text-xs text-muted-foreground">{formatDate(post.published_at)}</p>
          <h3 className={`font-semibold leading-tight ${featured ? 'text-2xl font-serif' : 'text-lg'}`}>{post.title}</h3>
          {post.excerpt && <p className="text-sm leading-relaxed text-muted-foreground">{truncate(post.excerpt, featured ? 220 : 120)}</p>}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-gold">
            Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function MinistryCard({ ministry }: { ministry: MinistryRow }) {
  return (
    <Link href={`/ministries/${ministry.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-colors group-hover:border-gold/40">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {ministry.image_url ? (
            <Image src={ministry.image_url} alt={ministry.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-background">
              <span className="font-serif text-3xl text-muted-foreground opacity-50">{ministry.name[0]}</span>
            </div>
          )}
        </div>
        <div className="space-y-2 p-5">
          <h3 className="text-lg font-semibold">{ministry.name}</h3>
          {ministry.short_description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{ministry.short_description}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function ScheduleList({ schedules }: { schedules: ServiceScheduleRow[] }) {
  if (schedules.length === 0) {
    return <p className="text-center text-muted-foreground">Service times will be posted soon.</p>;
  }
  return (
    <div className="mx-auto grid max-w-3xl gap-3">
      {schedules.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-5">
          <div>
            <p className="font-medium">{s.title}</p>
            <p className="text-sm text-muted-foreground">
              {s.is_special && s.special_date
                ? formatDate(s.special_date)
                : s.day_of_week != null
                  ? DAYS[s.day_of_week]
                  : ''}
              {s.audience ? ` · ${s.audience}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gold">
              {formatTime(s.start_time)}
              {s.end_time ? ` – ${formatTime(s.end_time)}` : ''}
            </p>
            {s.location && <p className="text-sm text-muted-foreground">{s.location}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampaignCard({ campaign }: { campaign: PledgeCampaignRow }) {
  const statusVariant =
    campaign.status === 'active' ? 'success' : campaign.status === 'completed' ? 'muted' : 'warning';
  return (
    <Card className="overflow-hidden">
      {campaign.cover_image_url && (
        <div className="relative aspect-[16/9] bg-muted">
          <Image src={campaign.cover_image_url} alt={campaign.title} fill className="object-cover" />
        </div>
      )}
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-semibold">{campaign.title}</h3>
          <Badge variant={statusVariant} className="capitalize">{campaign.status}</Badge>
        </div>
        {campaign.goal_amount != null && (
          <p className="text-sm text-muted-foreground">
            Goal: <span className="font-medium text-foreground">₱{Number(campaign.goal_amount).toLocaleString('en-PH')}</span>
          </p>
        )}
        {(campaign.start_date || campaign.end_date) && (
          <p className="text-xs text-muted-foreground">
            {campaign.start_date ? formatDate(campaign.start_date) : ''}
            {campaign.end_date ? ` – ${formatDate(campaign.end_date)}` : ''}
          </p>
        )}
      </div>
    </Card>
  );
}
