-- diary_entries 테이블 생성
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  mood text not null default '😊',
  content text,
  thanks text[] default '{""."",""}',
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table diary_entries enable row level security;

create policy "Users can view own entries"
  on diary_entries for select using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on diary_entries for insert with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on diary_entries for update using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on diary_entries for delete using (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger diary_entries_updated_at
  before update on diary_entries
  for each row execute function update_updated_at();

-- Storage bucket: diary-images
insert into storage.buckets (id, name, public) values ('diary-images', 'diary-images', true)
on conflict do nothing;

create policy "Auth users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'diary-images' and auth.role() = 'authenticated');

create policy "Images are public"
  on storage.objects for select
  using (bucket_id = 'diary-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);
