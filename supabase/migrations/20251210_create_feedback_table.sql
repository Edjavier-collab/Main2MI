-- Create feedback table
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Allow authenticated users to insert their own feedback
create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id or user_id is null);

-- Allow anonymous feedback (user_id = null)
create policy "Allow anonymous feedback insert"
  on public.feedback for insert
  with check (user_id is null);
