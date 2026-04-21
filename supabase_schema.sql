-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Interview templates
create table interviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  title text not null,
  token text unique not null,
  questions jsonb not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- Candidate sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id),
  candidate_name text,
  candidate_email text,
  transcript jsonb,
  scorecard jsonb,
  overall_score integer,
  recommendation text,
  status text default 'pending',
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_seconds integer
);
