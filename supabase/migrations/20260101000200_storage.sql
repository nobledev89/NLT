-- =====================================================================
-- Storage buckets
--  - "media": public-read image/asset library, writes restricted to the
--    media module. Files are served via public URLs (used by next/image).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- public read
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

-- only users with the media module may upload/update/delete
create policy "media insert"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.has_module('media'));

create policy "media update"
  on storage.objects for update
  using (bucket_id = 'media' and public.has_module('media'));

create policy "media delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.has_module('media'));
