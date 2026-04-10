-- OS Calendar App – Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables.

-- Events
create table if not exists events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  category text not null default 'work',
  color text not null default '#3B82F6',
  location text,
  attendees text[],
  wbs_id text,
  recurring text default 'none',
  tags text[],
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events enable row level security;
create policy "Users manage own events" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Projects
create table if not exists projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  color text not null default '#3B82F6',
  event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_date timestamptz,
  progress integer not null default 0
);

alter table projects enable row level security;
create policy "Users manage own projects" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tasks
create table if not exists tasks (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  assignee text,
  start_date timestamptz,
  due_date timestamptz,
  completed_at timestamptz,
  estimated_hours real,
  actual_hours real,
  progress integer not null default 0,
  parent_id text,
  children text[],
  event_id text,
  tags text[],
  dependencies text[],
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "Users manage own tasks" on tasks
  for all using (
    exists (select 1 from projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
  )
  with check (
    exists (select 1 from projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
  );

-- User Settings
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  theme text not null default 'light',
  week_starts_on integer not null default 1,
  default_view text not null default 'week',
  notifications_enabled boolean not null default true,
  gemini_api_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;
create policy "Users manage own settings" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Team Members
create table if not exists team_members (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text,
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;
create policy "Users manage own team" on team_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
