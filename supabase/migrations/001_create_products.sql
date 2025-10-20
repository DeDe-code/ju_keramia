-- Create products table for Ju Keramia e-commerce
create table if not exists public.products (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	description text,
	price numeric not null,
	images text[] default '{}',
	category text not null,
	dimensions jsonb,
	materials text[] default '{}',
	in_stock boolean not null default true,
	featured boolean not null default false,
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now()
);
