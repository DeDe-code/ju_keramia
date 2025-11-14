-- Table for hero images (landing & about pages)
create table if not exists public.hero_images (
    id uuid primary key default gen_random_uuid(),
    page_type text not null unique check (page_type in ('landing', 'about')),
    image_url text not null,
    cloudflare_key text not null, -- R2 object key for deletion
    alt_text text not null,
    width integer not null,
    height integer not null,
    file_size integer not null, -- in bytes
    uploaded_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create reusable trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply trigger to hero_images
create trigger update_hero_images_updated_at
    before update on public.hero_images
    for each row
    execute function update_updated_at_column();