-- =====================================================================
-- New Life Tagum — Seat booking (reserved seating for events)
-- Adds an optional reserved-seating flow on top of the existing events
-- module. A seating-enabled event exposes a fixed seat map; visitors pick
-- one or more seats which are then reserved (unique per event + seat label).
-- Online payment is intentionally deferred — bookings are recorded as
-- reserved and settled at the venue.
-- =====================================================================

-- ----- events: opt-in seat selection ---------------------------------

alter table public.events
  add column if not exists seating_enabled boolean not null default false;

-- ----- enum ----------------------------------------------------------

do $$ begin
  create type public.seat_booking_status as enum ('reserved', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----- seat bookings --------------------------------------------------

create table if not exists public.event_seat_bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  seat_label text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  status public.seat_booking_status not null default 'reserved',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- one active reservation per seat per event; cancelled rows free the seat
create unique index if not exists seat_bookings_unique_active
  on public.event_seat_bookings (event_id, seat_label)
  where status = 'reserved';
create index if not exists seat_bookings_event_idx
  on public.event_seat_bookings (event_id, status);
create index if not exists seat_bookings_profile_idx
  on public.event_seat_bookings (profile_id);

create trigger event_seat_bookings_updated_at before update on public.event_seat_bookings
  for each row execute function public.set_updated_at();

-- ----- RLS (mirrors event_rsvps: members manage their own; staff with
--            the event_rsvps module manage all; guest bookings are made
--            server-side via the service role) --------------------------

alter table public.event_seat_bookings enable row level security;

create policy seat_bookings_select on public.event_seat_bookings for select
  using (profile_id = auth.uid() or public.has_module('event_rsvps'));
create policy seat_bookings_insert_self on public.event_seat_bookings for insert
  with check (profile_id = auth.uid());
create policy seat_bookings_update_self on public.event_seat_bookings for update
  using (profile_id = auth.uid() or public.has_module('event_rsvps'))
  with check (profile_id = auth.uid() or public.has_module('event_rsvps'));
create policy seat_bookings_delete on public.event_seat_bookings for delete
  using (profile_id = auth.uid() or public.has_module('event_rsvps'));
