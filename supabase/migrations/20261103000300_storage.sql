-- =====================================================================
-- Storage buckets for media (product/category/blog images, logos) and
-- user avatars. Uploads are validated server-side as well (type, size,
-- magic bytes) before they reach storage.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Media: only active staff (admins/editors) can write. Public read is served
-- by the public bucket URL.
create policy "Staff read media objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_staff()))
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

-- Avatars: each user may only write inside a folder named with their user id.
create policy "Users read own avatar objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
