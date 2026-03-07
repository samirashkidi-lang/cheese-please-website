-- Bar Ten & Cheese Please — Supabase Database Setup
-- Run this in Supabase > SQL Editor

-- Reservations
create table if not exists reservations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text,
  party_size int,
  date date,
  time text,
  occasion text,
  status text default 'pending',
  notes text
);

-- Orders
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text,
  email text,
  phone text,
  items text,
  amount numeric,
  status text default 'pending',
  notes text
);

-- Inquiries (catering & private events)
create table if not exists inquiries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  type text,
  name text,
  email text,
  phone text,
  date date,
  guests int,
  message text,
  status text default 'new'
);

-- Menu items
create table if not exists menu (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text,
  price text,
  category text
);

-- Specials
create table if not exists specials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text,
  day text,
  time text,
  price text,
  active boolean default true
);

-- Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text,
  date date,
  time text,
  type text,
  recurring text default 'none',
  tickets boolean default false
);

-- Social posts
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  caption text,
  channels text[],
  date date,
  time text,
  theme text,
  status text default 'pending',
  image_url text
);

-- Email campaigns
create table if not exists emails (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  subject text,
  preview text,
  type text,
  body text,
  date date,
  time text,
  status text default 'draft',
  sent_count int default 0,
  opens int default 0,
  clicks int default 0
);

-- Enable Row Level Security (open for now, lock down later)
alter table reservations enable row level security;
alter table orders enable row level security;
alter table inquiries enable row level security;
alter table menu enable row level security;
alter table specials enable row level security;
alter table events enable row level security;
alter table posts enable row level security;
alter table emails enable row level security;

-- Allow all operations for now (we'll add auth later)
create policy "allow all" on reservations for all using (true) with check (true);
create policy "allow all" on orders for all using (true) with check (true);
create policy "allow all" on inquiries for all using (true) with check (true);
create policy "allow all" on menu for all using (true) with check (true);
create policy "allow all" on specials for all using (true) with check (true);
create policy "allow all" on events for all using (true) with check (true);
create policy "allow all" on posts for all using (true) with check (true);
create policy "allow all" on emails for all using (true) with check (true);
