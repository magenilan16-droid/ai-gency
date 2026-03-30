-- AI-gency Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/hkejxuytgujiqznogxmh/sql

-- 1. Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('client', 'advisor', 'admin')) default 'client',
  referral_code text unique,
  referred_by uuid references profiles(id),
  commission_rate decimal default 0.35,
  total_clicks integer default 0,
  total_earned decimal default 0,
  pending_payout decimal default 0,
  created_at timestamptz default now()
);

-- 2. Trips table
create table if not exists trips (
  id text primary key,
  user_id uuid references auth.users,
  destination text,
  data jsonb,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- 3. Commission clicks (tracks affiliate link clicks)
create table if not exists commission_clicks (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references profiles(id),
  client_id uuid references profiles(id),
  trip_id text,
  affiliate_type text,
  destination text,
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security
alter table profiles enable row level security;
alter table trips enable row level security;
alter table commission_clicks enable row level security;

-- 5. RLS Policies

-- Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Admin can view all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Advisor can view referred clients" on profiles for select using (
  referred_by = auth.uid()
);

-- Trips
create policy "Users can view own trips" on trips for select using (auth.uid() = user_id);
create policy "Users can insert own trips" on trips for insert with check (auth.uid() = user_id);
create policy "Users can update own trips" on trips for update using (auth.uid() = user_id);
create policy "Users can delete own trips" on trips for delete using (auth.uid() = user_id);
create policy "Public trips viewable by all" on trips for select using (is_public = true);

-- Commission clicks
create policy "Advisors can view own commissions" on commission_clicks for select using (advisor_id = auth.uid());
create policy "Anyone can insert commission clicks" on commission_clicks for insert with check (true);
create policy "Admin can view all commissions" on commission_clicks for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 6. Auto-generate referral code for advisors
create or replace function generate_referral_code()
returns trigger as $$
begin
  if new.role = 'advisor' and new.referral_code is null then
    new.referral_code := upper(substring(md5(new.id::text || now()::text) from 1 for 8));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_referral_code
  before insert or update on profiles
  for each row execute function generate_referral_code();

-- 7. Make yourself admin (replace with YOUR email)
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
