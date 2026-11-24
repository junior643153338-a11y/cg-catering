begin;

create type public.catering_contact_kind as enum ('client', 'employee', 'supplier');
create type public.catering_event_status as enum ('request', 'confirmed', 'completed', 'cancelled');
create type public.catering_movement_kind as enum ('deposit', 'payment', 'expense');
create type public.catering_menu_unit as enum ('person', 'event');

create table public.catering_menus (
  id text primary key,
  name text not null check (length(btrim(name)) between 1 and 100),
  category text not null,
  description text not null,
  details text[] not null default '{}',
  terms text not null default '',
  price_pyg bigint check (price_pyg between 0 and 1000000000),
  minimum_guests integer check (minimum_guests between 1 and 1000000),
  below_minimum_consultation boolean not null default false,
  billing_unit public.catering_menu_unit not null default 'person',
  option_group text,
  variant integer check (variant > 0),
  photo_path text,
  choices jsonb check (choices is null or jsonb_typeof(choices) = 'object'),
  position integer not null default 0,
  active boolean not null default false,
  unique (option_group, variant),
  check ((option_group is null) = (variant is null)),
  check (not below_minimum_consultation or minimum_guests is not null)
);

create table public.catering_contacts (
  id uuid primary key default gen_random_uuid(),
  kind public.catering_contact_kind not null,
  name text not null check (length(btrim(name)) between 1 and 100),
  phone text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (id, kind)
);

create table public.catering_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  client_kind public.catering_contact_kind not null default 'client' check (client_kind = 'client'),
  title text not null check (length(btrim(title)) between 1 and 100),
  starts_at timestamptz not null,
  location text not null check (length(btrim(location)) between 1 and 160),
  guests integer not null check (guests between 1 and 1000000),
  agreed_pyg bigint check (agreed_pyg >= 0),
  status public.catering_event_status not null default 'request',
  created_at timestamptz not null default now(),
  foreign key (client_id, client_kind) references public.catering_contacts(id, kind)
);

create table public.catering_event_menus (
  event_id uuid not null references public.catering_events(id) on delete cascade,
  menu_id text references public.catering_menus(id) on delete set null,
  position integer not null check (position >= 0),
  menu_name text not null,
  price_snapshot_pyg bigint check (price_snapshot_pyg >= 0),
  billing_unit public.catering_menu_unit not null,
  selections text[] not null default '{}',
  primary key (event_id, position)
);

create table public.catering_movements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.catering_events(id) on delete restrict,
  posted_on date not null,
  kind public.catering_movement_kind not null,
  description text not null check (length(btrim(description)) between 1 and 150),
  amount_pyg bigint not null check (amount_pyg between 1 and 1000000000000),
  created_at timestamptz not null default now()
);

create index catering_events_by_time on public.catering_events(starts_at);
create index catering_events_by_client on public.catering_events(client_id);
create index catering_movements_by_event on public.catering_movements(event_id, posted_on);

alter table public.catering_menus enable row level security;
alter table public.catering_contacts enable row level security;
alter table public.catering_events enable row level security;
alter table public.catering_event_menus enable row level security;
alter table public.catering_movements enable row level security;

revoke all on public.catering_menus, public.catering_contacts, public.catering_events,
  public.catering_event_menus, public.catering_movements from anon, authenticated;
grant select on public.catering_menus to anon;
grant select, insert, update, delete on public.catering_menus, public.catering_contacts,
  public.catering_events, public.catering_event_menus, public.catering_movements to authenticated;

create policy "Published menus are readable" on public.catering_menus
  for select to anon, authenticated using (active);

create policy "Catering admins manage menus" on public.catering_menus
  for all to authenticated using ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin');
create policy "Catering admins manage contacts" on public.catering_contacts
  for all to authenticated using ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin');
create policy "Catering admins manage events" on public.catering_events
  for all to authenticated using ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin');
create policy "Catering admins manage event menus" on public.catering_event_menus
  for all to authenticated using ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin');
create policy "Catering admins manage movements" on public.catering_movements
  for all to authenticated using ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'catering_role' = 'admin');

commit;
