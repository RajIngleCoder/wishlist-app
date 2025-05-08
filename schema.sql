-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  avatar_url text,
  currency text default 'USD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a trigger to set updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Create a trigger to automatically create a profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for wishes
create table if not exists public.wishes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10,2),
  priority text,
  link text,
  image_url text,
  list_id text,
  category text,
  tags text[],
  source text,
  metadata jsonb,
  is_favorite boolean default false,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for wishes
alter table public.wishes enable row level security;

-- Create policies for wishes
create policy "Users can view their own wishes"
  on wishes for select
  using ( auth.uid() = user_id );

create policy "Users can create their own wishes"
  on wishes for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own wishes"
  on wishes for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own wishes"
  on wishes for delete
  using ( auth.uid() = user_id );
