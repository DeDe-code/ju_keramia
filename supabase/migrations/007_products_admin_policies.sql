-- Products Admin Policies
-- Allow authenticated users to INSERT, UPDATE, and DELETE products
-- In production, you should add additional checks to verify admin role

-- Policy for INSERT
create policy "Authenticated users can insert products" on products
for insert
to authenticated
with check (true);

-- Policy for UPDATE
create policy "Authenticated users can update products" on products
for update
to authenticated
using (true)
with check (true);

-- Policy for DELETE
create policy "Authenticated users can delete products" on products
for delete
to authenticated
using (true);
