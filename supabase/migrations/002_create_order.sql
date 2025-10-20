-- Create orders table for Ju Keramia e-commerce
create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete set null,
	items jsonb not null,
	total numeric not null,
	status text not null default 'pending',
	shipping_address text,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now()
);
