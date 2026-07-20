-- =====================================================================
-- New Life Tagum — Seat booking service sessions (morning / evening)
-- Each seating-enabled event now runs two independent seat sets: one for
-- the morning service and one for the evening service. The same physical
-- seat can be reserved once per session, so uniqueness is keyed by
-- (event_id, service_session, seat_label).
--
-- This also clears the pre-session trial bookings, which had no session.
-- =====================================================================

do $$ begin
  create type public.service_session as enum ('morning', 'evening');
exception when duplicate_object then null; end $$;

-- Remove trial bookings created before sessions existed.
delete from public.event_seat_bookings;

alter table public.event_seat_bookings
  add column if not exists service_session public.service_session not null default 'morning';

-- Rebuild active-reservation uniqueness to be per session, so a seat can be
-- held separately for the morning and the evening service.
drop index if exists public.seat_bookings_unique_active;
create unique index if not exists seat_bookings_unique_active
  on public.event_seat_bookings (event_id, service_session, seat_label)
  where status = 'reserved';
