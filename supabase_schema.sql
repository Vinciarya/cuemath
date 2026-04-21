-- Recruiters (maps to Supabase auth.users)
create table recruiters (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- Interview templates
create table interviews (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references recruiters(id) on delete cascade,
  title text not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  questions jsonb not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- Candidate sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade,
  candidate_name text,
  candidate_email text,
  transcript jsonb default '[]',
  scorecard jsonb,
  overall_score integer,
  recommendation text,
  status text default 'pending',
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_seconds integer
);

-- RLS Policies
alter table recruiters enable row level security;
alter table interviews enable row level security;
alter table sessions enable row level security;

-- Recruiters: only see own profile
create policy "recruiters_own" on recruiters
  for all using (auth.uid() = id);

-- Interviews: recruiters see only their own
create policy "interviews_own" on interviews
  for all using (auth.uid() = recruiter_id);

-- Interviews: public can read active ones by token (for candidates)
create policy "interviews_public_read" on interviews
  for select using (status = 'active');

-- Sessions: recruiters see sessions for their interviews
create policy "sessions_recruiter_read" on sessions
  for select using (
    interview_id in (
      select id from interviews where recruiter_id = auth.uid()
    )
  );

-- Sessions: public can insert and update (candidates submitting answers)
create policy "sessions_public_insert" on sessions
  for insert with check (true);

create policy "sessions_public_update" on sessions
  for update using (true);

-- Auto-create recruiter profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.recruiters (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
