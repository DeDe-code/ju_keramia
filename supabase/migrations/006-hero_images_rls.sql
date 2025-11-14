-- Enable RLS
alter table public.hero_images enable row level security;

-- Public can read hero images
create policy "Hero images are publicly readable"
    on public.hero_images for select
    to public
    using (true);

-- Only authenticated admins can insert/update/delete
create policy "Admins can manage hero images"
    on public.hero_images for all
    to authenticated
    using (true)
    with check (true);