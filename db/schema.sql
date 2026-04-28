-- Sportsball — Supabase schema v1
-- Run this in your Supabase project's SQL editor.
-- Auth lives in Supabase's auth.users; we extend with profiles and app data.

-- =============================================================
-- PROFILES
-- =============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  preferred_lens text default 'plain',
  preferred_league text check (preferred_league in ('nfl', 'nba', 'both')),
  created_at timestamptz default now(),
  beta_invited_at timestamptz,
  beta_activated_at timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =============================================================
-- CONVERSATIONS + MESSAGES
-- =============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  lens text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conversations_user on conversations(user_id, updated_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  context_used jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on messages(conversation_id, created_at);

-- =============================================================
-- LESSONS
-- =============================================================
create table if not exists lesson_progress (
  user_id uuid references profiles(id) on delete cascade,
  lesson_slug text not null,
  status text not null check (status in ('started', 'completed')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_slug)
);

-- =============================================================
-- SCANS
-- =============================================================
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  storage_path text,
  detected jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_scans_user on scans(user_id, created_at desc);

-- =============================================================
-- BETA INVITES
-- =============================================================
create table if not exists beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  invited_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================================
-- STREAKS
-- =============================================================
create table if not exists user_streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table lesson_progress enable row level security;
alter table scans enable row level security;
alter table user_streaks enable row level security;

-- Profiles: users can read + update their own
create policy "users can read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Conversations: users own their conversations
create policy "users can read own conversations" on conversations
  for select using (auth.uid() = user_id);
create policy "users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);
create policy "users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

-- Messages: tied to conversations the user owns
create policy "users can read own messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
create policy "users can insert own messages" on messages
  for insert with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Lesson progress: users own their progress
create policy "users can read own progress" on lesson_progress
  for select using (auth.uid() = user_id);
create policy "users can write own progress" on lesson_progress
  for all using (auth.uid() = user_id);

-- Scans
create policy "users can read own scans" on scans
  for select using (auth.uid() = user_id);
create policy "users can insert own scans" on scans
  for insert with check (auth.uid() = user_id);

-- Streaks
create policy "users can read own streak" on user_streaks
  for select using (auth.uid() = user_id);
create policy "users can write own streak" on user_streaks
  for all using (auth.uid() = user_id);

-- Beta invites: read-only for the invited user (matched by email)
-- We'll handle invite redemption server-side via the service role key.
