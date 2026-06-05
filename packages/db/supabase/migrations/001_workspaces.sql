-- ============================================================
-- Komet: Workspaces Migration
-- Run this in your Supabase SQL Editor
-- Creates workspaces and workspace_members tables
-- ============================================================

-- 1. Workspaces table
create table if not exists public.workspaces (
  id          text        primary key default gen_random_uuid()::text,
  name        text        not null,
  slug        text        not null unique,
  description text,
  owner_id    text        not null,
  is_deleted  boolean     not null default false,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- 2. Workspace members table
create table if not exists public.workspace_members (
  id           text        primary key default gen_random_uuid()::text,
  workspace_id text        not null references public.workspaces(id) on delete cascade,
  user_id      text        not null,
  role         text        not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  joined_at    timestamptz not null default now(),
  unique(workspace_id, user_id)
);

-- 3. Indexes
create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);

-- 4. Enable Row Level Security
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- 5. RLS Policies for workspaces
-- Members can read workspaces they belong to
create policy "workspaces_select_member"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()::text
    )
    or owner_id = auth.uid()::text
  );

-- Owner can create workspaces (any authenticated user can create)
create policy "workspaces_insert_authenticated"
  on public.workspaces for insert
  with check (owner_id = auth.uid()::text);

-- Owner can update their own workspaces
create policy "workspaces_update_owner"
  on public.workspaces for update
  using (owner_id = auth.uid()::text);

-- Owner can soft-delete their own workspaces
create policy "workspaces_delete_owner"
  on public.workspaces for delete
  using (owner_id = auth.uid()::text);

-- 6. RLS Policies for workspace_members
-- Members can see other members in same workspace
create policy "workspace_members_select"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspace_members as wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()::text
    )
  );

-- Authenticated user can insert themselves as member
create policy "workspace_members_insert"
  on public.workspace_members for insert
  with check (user_id = auth.uid()::text);

-- Owner/admin can update members
create policy "workspace_members_update"
  on public.workspace_members for update
  using (
    exists (
      select 1 from public.workspace_members as wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()::text
        and wm.role = 'admin'
    )
  );
