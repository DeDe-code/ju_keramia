-- Enable RLS on products table
alter table products enable row level security;

-- Allow anyone to select (read) products
create policy "Public read access" on products
for select
using (true);
