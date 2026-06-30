-- =====================================================================
-- New Life Tagum — Row Level Security
-- Helper functions are SECURITY DEFINER so they bypass RLS on profiles and
-- avoid recursive policy evaluation.
-- =====================================================================

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin')
  );
$$;

create or replace function public.is_staff_or_above()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin', 'staff')
  );
$$;

-- admin/super_admin implicitly hold every module; staff need an explicit grant
create or replace function public.has_module(module_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      join public.staff_permissions sp on sp.profile_id = p.id
      where p.id = auth.uid()
        and p.role = 'staff'
        and sp.module = module_key
    );
$$;

-- ----- guard: prevent privilege escalation on profiles ---------------

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- role or placeholder flag changes require admin
  if (new.role is distinct from old.role) or (new.is_placeholder is distinct from old.is_placeholder) then
    if not public.is_admin() then
      raise exception 'Only admins may change roles';
    end if;
    -- only super admins may grant/alter super_admin or touch a super_admin
    if (new.role = 'super_admin' or old.role = 'super_admin') and not public.is_super_admin() then
      raise exception 'Only super admins may manage super admin accounts';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ----- enable RLS everywhere -----------------------------------------

alter table public.profiles enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.pages enable row level security;
alter table public.page_blocks enable row level security;
alter table public.page_revisions enable row level security;
alter table public.media_assets enable row level security;
alter table public.posts enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_category_assignments enable row level security;
alter table public.comments enable row level security;
alter table public.service_schedules enable row level security;
alter table public.sermon_series enable row level security;
alter table public.sermons enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.ministries enable row level security;
alter table public.pledge_campaigns enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.pledge_submissions enable row level security;
alter table public.connection_forms enable row level security;
alter table public.connection_form_fields enable row level security;
alter table public.connection_form_submissions enable row level security;
alter table public.merch_items enable row level security;
alter table public.audit_logs enable row level security;

-- ----- profiles -------------------------------------------------------

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_delete on public.profiles for delete
  using (public.is_super_admin());

-- ----- staff_permissions ---------------------------------------------

create policy staff_perms_select on public.staff_permissions for select
  using (profile_id = auth.uid() or public.is_admin());
create policy staff_perms_write on public.staff_permissions for all
  using (public.is_admin()) with check (public.is_admin());

-- ----- site_settings (public read, super-admin write) ----------------

create policy settings_select on public.site_settings for select using (true);
create policy settings_write on public.site_settings for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ----- navigation (public read, super-admin write) -------------------

create policy nav_select on public.navigation_items for select using (true);
create policy nav_write on public.navigation_items for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ----- pages / blocks / revisions ------------------------------------

create policy pages_public_select on public.pages for select
  using ((status = 'published' and deleted_at is null) or public.has_module('pages'));
create policy pages_write on public.pages for all
  using (public.has_module('pages')) with check (public.has_module('pages'));

create policy blocks_public_select on public.page_blocks for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_blocks.page_id
        and ((p.status = 'published' and p.deleted_at is null) or public.has_module('pages'))
    )
  );
create policy blocks_write on public.page_blocks for all
  using (public.has_module('pages')) with check (public.has_module('pages'));

create policy revisions_rw on public.page_revisions for all
  using (public.has_module('pages')) with check (public.has_module('pages'));

-- ----- media ----------------------------------------------------------

create policy media_select on public.media_assets for select
  using (public.is_staff_or_above());
create policy media_write on public.media_assets for all
  using (public.has_module('media')) with check (public.has_module('media'));

-- ----- posts / categories / comments ---------------------------------

create policy posts_public_select on public.posts for select
  using (
    (status = 'published' and published_at <= now() and deleted_at is null)
    or public.has_module('posts')
  );
create policy posts_write on public.posts for all
  using (public.has_module('posts')) with check (public.has_module('posts'));

create policy categories_select on public.post_categories for select using (true);
create policy categories_write on public.post_categories for all
  using (public.has_module('posts')) with check (public.has_module('posts'));

create policy pca_select on public.post_category_assignments for select using (true);
create policy pca_write on public.post_category_assignments for all
  using (public.has_module('posts')) with check (public.has_module('posts'));

create policy comments_select on public.comments for select
  using (status = 'approved' or author_id = auth.uid() or public.has_module('comments'));
-- members may insert their own comment; a trigger forces status='pending'
create policy comments_insert on public.comments for insert
  with check (author_id = auth.uid());
create policy comments_moderate on public.comments for update
  using (public.has_module('comments')) with check (public.has_module('comments'));
create policy comments_delete on public.comments for delete
  using (public.has_module('comments') or author_id = auth.uid());

-- force new comments to pending unless the author is a moderator
create or replace function public.force_comment_pending()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_module('comments') then
    new.status := 'pending';
  end if;
  return new;
end;
$$;
drop trigger if exists comments_force_pending on public.comments;
create trigger comments_force_pending before insert on public.comments
  for each row execute function public.force_comment_pending();

-- ----- services / sermons --------------------------------------------

create policy services_public_select on public.service_schedules for select
  using (published or public.has_module('services'));
create policy services_write on public.service_schedules for all
  using (public.has_module('services')) with check (public.has_module('services'));

create policy series_public_select on public.sermon_series for select using (true);
create policy series_write on public.sermon_series for all
  using (public.has_module('services')) with check (public.has_module('services'));

create policy sermons_public_select on public.sermons for select
  using (published or public.has_module('services'));
create policy sermons_write on public.sermons for all
  using (public.has_module('services')) with check (public.has_module('services'));

-- ----- events / rsvps -------------------------------------------------

create policy events_public_select on public.events for select
  using (
    (status = 'published' and is_public and deleted_at is null)
    or public.has_module('events')
  );
create policy events_write on public.events for all
  using (public.has_module('events')) with check (public.has_module('events'));

-- members manage their own RSVP; staff with module manage all
create policy rsvps_select on public.event_rsvps for select
  using (profile_id = auth.uid() or public.has_module('event_rsvps'));
create policy rsvps_insert_self on public.event_rsvps for insert
  with check (profile_id = auth.uid());
create policy rsvps_update_self on public.event_rsvps for update
  using (profile_id = auth.uid() or public.has_module('event_rsvps'))
  with check (profile_id = auth.uid() or public.has_module('event_rsvps'));
create policy rsvps_delete on public.event_rsvps for delete
  using (profile_id = auth.uid() or public.has_module('event_rsvps'));

-- ----- ministries -----------------------------------------------------

create policy ministries_public_select on public.ministries for select
  using (published or public.has_module('ministries'));
create policy ministries_write on public.ministries for all
  using (public.has_module('ministries')) with check (public.has_module('ministries'));

-- ----- pledge / giving ------------------------------------------------

create policy campaigns_public_select on public.pledge_campaigns for select
  using (status <> 'cancelled' or public.has_module('pledge_campaigns'));
create policy campaigns_write on public.pledge_campaigns for all
  using (public.has_module('pledge_campaigns')) with check (public.has_module('pledge_campaigns'));

create policy banks_public_select on public.bank_accounts for select
  using (active or public.has_module('pledge_campaigns'));
create policy banks_write on public.bank_accounts for all
  using (public.has_module('pledge_campaigns')) with check (public.has_module('pledge_campaigns'));

-- pledge submissions: members see their own; staff with module see all.
-- public/guest submissions are created server-side via the service role.
create policy pledge_subs_select on public.pledge_submissions for select
  using (profile_id = auth.uid() or public.has_module('pledge_submissions'));
create policy pledge_subs_insert_self on public.pledge_submissions for insert
  with check (profile_id = auth.uid());
create policy pledge_subs_write on public.pledge_submissions for update
  using (public.has_module('pledge_submissions')) with check (public.has_module('pledge_submissions'));
create policy pledge_subs_delete on public.pledge_submissions for delete
  using (public.has_module('pledge_submissions'));

-- ----- connection forms ----------------------------------------------

create policy forms_public_select on public.connection_forms for select
  using (enabled or public.has_module('connection_forms'));
create policy forms_write on public.connection_forms for all
  using (public.has_module('connection_forms')) with check (public.has_module('connection_forms'));

create policy form_fields_public_select on public.connection_form_fields for select
  using (
    exists (
      select 1 from public.connection_forms f
      where f.id = connection_form_fields.form_id
        and (f.enabled or public.has_module('connection_forms'))
    )
  );
create policy form_fields_write on public.connection_form_fields for all
  using (public.has_module('connection_forms')) with check (public.has_module('connection_forms'));

create policy form_subs_select on public.connection_form_submissions for select
  using (profile_id = auth.uid() or public.has_module('form_submissions'));
create policy form_subs_insert_self on public.connection_form_submissions for insert
  with check (profile_id = auth.uid());
create policy form_subs_write on public.connection_form_submissions for update
  using (public.has_module('form_submissions')) with check (public.has_module('form_submissions'));
create policy form_subs_delete on public.connection_form_submissions for delete
  using (public.has_module('form_submissions'));

-- ----- merch ----------------------------------------------------------

create policy merch_public_select on public.merch_items for select
  using (status = 'published' or public.has_module('merch'));
create policy merch_write on public.merch_items for all
  using (public.has_module('merch')) with check (public.has_module('merch'));

-- ----- audit logs (admin read; inserts via service role) -------------

create policy audit_select on public.audit_logs for select
  using (public.is_admin());
