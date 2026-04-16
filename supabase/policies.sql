alter table snack_orders enable row level security;

-- Example: allow all authenticated users full access (tighten later)
create policy "authenticated full access"
on snack_orders
for all
to authenticated
using (true)
with check (true);