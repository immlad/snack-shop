create table if not exists snack_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  items jsonb,
  total numeric,
  status text default 'pending',
  created_at timestamp with time zone default now()
);