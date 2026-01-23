-- Create a new private bucket 'avatars'
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated users to upload files to 'avatars'
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Policy: Allow public to view avatars
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- Policy: Allow users to update/delete their own avatars (optional but good practice)
-- Assuming file name contains user_id or similar, but for now simple insert/select is key.
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' AND auth.uid() = owner );
