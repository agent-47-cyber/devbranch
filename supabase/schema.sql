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
  id text primary key,
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

-- Browser clients have no direct access. Next.js uses the server-only service key.
alter table public.events enable row level security;
alter table public.possible_links enable row level security;
alter table public.source_status enable row level security;
create index if not exists events_observed_at_idx on public.events (observed_at desc);
