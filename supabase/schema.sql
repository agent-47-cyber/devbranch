create table if not exists events (
  id text primary key,
  source text not null,
  type text not null,
  area text not null,
  latitude double precision not null,
  longitude double precision not null,
  observed_at timestamptz not null,
  received_at timestamptz not null,
  value double precision not null,
  unit text not null,
  simulated boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists possible_links (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  event_ids jsonb not null,
  signals jsonb not null,
  time_score double precision not null,
  location_score double precision not null,
  unusual_score double precision not null,
  link_score double precision not null,
  summary text,
  created_at timestamptz default now()
);

create table if not exists source_status (
  source text primary key,
  status text not null,
  last_success timestamptz,
  last_attempt timestamptz,
  error text,
  updated_at timestamptz default now()
);
