-- Create table for tracking dual-run comparison results
-- Used by System Sovereign for Strangler Fig migration

create table if not exists public.dual_run_tracking (
  id uuid primary key default gen_random_uuid(),
  function_name text not null check (function_name in ('analyze-session', 'coaching-summary')),
  user_id uuid references auth.users(id) on delete cascade,
  run_timestamp timestamptz not null default now(),
  
  -- Comparison results
  exact_match boolean not null,
  semantic_equal boolean not null,
  differences jsonb, -- Array of difference objects
  
  -- Match tracking
  consecutive_semantic_matches integer not null default 0,
  total_runs integer not null default 0,
  
  -- Metadata
  legacy_output jsonb,
  adapted_output jsonb,
  error_message text,
  
  created_at timestamptz not null default now()
);

-- Index for efficient queries
create index if not exists idx_dual_run_tracking_function_name on public.dual_run_tracking(function_name);
create index if not exists idx_dual_run_tracking_user_id on public.dual_run_tracking(user_id);
create index if not exists idx_dual_run_tracking_timestamp on public.dual_run_tracking(run_timestamp desc);

-- Enable RLS
alter table public.dual_run_tracking enable row level security;

-- Policy: Users can read their own tracking data
DROP POLICY IF EXISTS "Users can read their own dual-run tracking" ON public.dual_run_tracking;
create policy "Users can read their own dual-run tracking"
  on public.dual_run_tracking for select
  using (auth.uid() = user_id);

-- Policy: Service role can insert/update (for Edge Functions)
DROP POLICY IF EXISTS "Service role can manage dual-run tracking" ON public.dual_run_tracking;
create policy "Service role can manage dual-run tracking"
  on public.dual_run_tracking for all
  using (true); -- Edge Functions use service role

-- Create view for match statistics
create or replace view public.dual_run_match_stats as
select 
  function_name,
  count(*) as total_runs,
  count(*) filter (where semantic_equal) as semantic_equal_count,
  count(*) filter (where exact_match) as exact_match_count,
  max(consecutive_semantic_matches) as max_consecutive_matches,
  max(run_timestamp) as last_run_timestamp
from public.dual_run_tracking
group by function_name;
