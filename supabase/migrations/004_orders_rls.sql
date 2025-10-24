-- Add guest_token column to orders table
alter table orders add column if not exists guest_token text;

-- Enable RLS on orders table
alter table orders enable row level security;

-- Allow anyone to insert orders
create policy "Anyone can place orders" on orders
for insert
with check (true);

-- Allow authenticated users to view their own orders
create policy "Users can view their own orders" on orders
for select
using (auth.uid() = user_id);

-- Allow authenticated users to update their own orders
create policy "Users can update their own orders" on orders
for update
using (auth.uid() = user_id);

-- Allow authenticated users to delete their own orders
create policy "Users can delete their own orders" on orders
for delete
using (auth.uid() = user_id);

-- Allow guests to view their own orders using guest_token
create policy "Guests can view their own orders" on orders
for select
using (
	guest_token is not null and guest_token = current_setting('jwt.claims.guest_token', true)
);

-- Allow guests to update their own orders using guest_token
create policy "Guests can update their own orders" on orders
for update
using (
	guest_token is not null and guest_token = current_setting('jwt.claims.guest_token', true)
);

-- Allow guests to delete their own orders using guest_token
create policy "Guests can delete their own orders" on orders
for delete
using (
	guest_token is not null and guest_token = current_setting('jwt.claims.guest_token', true)
);

--