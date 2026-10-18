-- Little Bunny v1: execute in the Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.bunny_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null default '',
 drawing_data text,
 color text not null default '#f5e6a9',
 created_at timestamptz not null default now(),
 created_on date not null default ((now() at time zone 'Asia/Shanghai')::date),
 constraint bunny_notes_body_or_drawing check (length(trim(body)) > 0 or drawing_data is not null),
 constraint bunny_notes_body_length check (length(body) <= 3000)
);
create index if not exists bunny_notes_user_created_idx on public.bunny_notes(user_id,created_at desc);
alter table public.bunny_notes enable row level security;
drop policy if exists "Users can read own bunny notes" on public.bunny_notes;
create policy "Users can read own bunny notes" on public.bunny_notes for select to authenticated using(auth.uid()=user_id);
drop policy if exists "Users can create own notes for today" on public.bunny_notes;
create policy "Users can create own notes for today" on public.bunny_notes for insert to authenticated with check(auth.uid()=user_id and created_on=(now() at time zone 'Asia/Shanghai')::date);
drop policy if exists "Users can update own notes created today" on public.bunny_notes;
create policy "Users can update own notes created today" on public.bunny_notes for update to authenticated using(auth.uid()=user_id and created_on=(now() at time zone 'Asia/Shanghai')::date) with check(auth.uid()=user_id and created_on=(now() at time zone 'Asia/Shanghai')::date);
drop policy if exists "Users can delete own notes created today" on public.bunny_notes;
create policy "Users can delete own notes created today" on public.bunny_notes for delete to authenticated using(auth.uid()=user_id and created_on=(now() at time zone 'Asia/Shanghai')::date);
create or replace function public.guard_bunny_note_update() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.user_id<>old.user_id or new.created_at<>old.created_at or new.created_on<>old.created_on then raise exception 'Note ownership and creation date cannot be changed'; end if;
 if old.created_on<>(now() at time zone 'Asia/Shanghai')::date then raise exception 'Historical notes are read-only'; end if;
 return new;
end; $$;
drop trigger if exists bunny_note_immutable_metadata on public.bunny_notes;
create trigger bunny_note_immutable_metadata before update on public.bunny_notes for each row execute function public.guard_bunny_note_update();
-- Before deployment, enable email/password auth in Supabase Auth settings.
-- Never put the Supabase service_role key in browser code.