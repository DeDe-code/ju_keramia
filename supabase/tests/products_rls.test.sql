-- Database security tests for the products table Row Level Security (RLS) policies.
--
-- RLS — Row Level Security: PostgreSQL rules that decide which rows a role may read or change.
--
-- Run against the isolated local database only:
--   supabase test db --local
--
-- The assertions below switch to the same PostgreSQL roles a Supabase client uses
-- (anon / authenticated) instead of running as the table owner, so a passing suite
-- proves the policies themselves protect the table. The synthetic fixtures and the
-- simulated authentication claims are discarded by the final rollback.

begin;

select plan(26);

-- Synthetic fixture. It is inserted as the test role because the products policies
-- intentionally expose no public INSERT path.
insert into public.products (id, name, slug, price, category)
values (
  '11111111-1111-1111-1111-111111111111',
  'pgTAP synthetic product',
  'pgtap-synthetic-product',
  10.00,
  'pgtap'
);

select is(
  (select count(*) from public.products where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'synthetic fixture row exists before access assertions'
);

-- Anonymous visitors: public read is allowed, every write must be denied.
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

select is(current_user::text, 'anon', 'assertions are executed as the anon role');

-- Each write permission is asserted separately: a combined
-- 'INSERT,UPDATE,DELETE' check passes when only one of them is granted, which
-- would hide a missing grant behind a passing test.
select is(
  has_table_privilege('anon', 'public.products', 'INSERT'),
  true,
  'anon holds table-level INSERT privilege, so the denial below comes from RLS'
);
select is(
  has_table_privilege('anon', 'public.products', 'UPDATE'),
  true,
  'anon holds table-level UPDATE privilege, so the denial below comes from RLS'
);
select is(
  has_table_privilege('anon', 'public.products', 'DELETE'),
  true,
  'anon holds table-level DELETE privilege, so the denial below comes from RLS'
);

-- row_security_active() is true only when row security actually applies to this
-- session: RLS enabled on the table and the current role is neither the table
-- owner nor a BYPASSRLS role. It therefore proves the denials below come from
-- policies instead of silently disabled RLS.
select is(
  row_security_active('public.products'),
  true,
  'RLS is active for the anon role, so denials are enforced by policies'
);
select is(
  (select count(*) from public.products where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'anon can read products'
);
select throws_ok(
  $$ insert into public.products (name, slug, price, category)
     values ('anon inserted product', 'pgtap-anon-insert', 1.00, 'pgtap') $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'anon insert is rejected by RLS'
);
select results_eq(
  $$ with changed as (
       update public.products set name = 'tampered by anon'
       where id = '11111111-1111-1111-1111-111111111111'
       returning id
     )
     select id from changed $$,
  $$ select null::uuid where false $$,
  'anon update changes no rows'
);
select results_eq(
  $$ with removed as (
       delete from public.products
       where id = '11111111-1111-1111-1111-111111111111'
       returning id
     )
     select id from removed $$,
  $$ select null::uuid where false $$,
  'anon delete removes no rows'
);

reset role;

select is(
  (select name from public.products where id = '11111111-1111-1111-1111-111111111111'),
  'pgTAP synthetic product',
  'anon attempts left the fixture unchanged'
);
select is(
  (select count(*) from public.products where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'anon attempts left the fixture in place'
);

-- Ordinary authenticated users: still no administrator rights, so writes must be denied.
-- A simulated JWT claim alone is not enough: is_admin() reads auth.users, so the
-- session below needs a matching non-administrator row. id is the only required
-- column in the local schema; the remaining values keep the row recognizable and
-- give is_admin() explicit non-admin metadata. The .invalid domain is reserved for
-- test use (RFC 2606), so this fixture can never collide with a real address.
insert into auth.users (id, aud, role, email, raw_user_meta_data)
values (
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'pgtap-synthetic-user@example.invalid',
  '{}'::jsonb
);

select ok(
  exists (
    select 1 from auth.users where id = '22222222-2222-2222-2222-222222222222'
  ),
  'the synthetic authenticated user exists in auth.users, so is_admin() checks a real non-admin row'
);

set local role authenticated;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}';

select is(current_user::text, 'authenticated', 'assertions are executed as the authenticated role');
select is(
  auth.uid(),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'the synthetic JWT subject is visible through auth.uid(), so an authenticated session is correctly simulated'
);
select is(
  public.is_admin(),
  false,
  'the synthetic authenticated user has no administrator rights, so writes must be denied'
);
select is(
  has_table_privilege('authenticated', 'public.products', 'INSERT'),
  true,
  'authenticated holds table-level INSERT privilege, so the denial below comes from RLS'
);
select is(
  has_table_privilege('authenticated', 'public.products', 'UPDATE'),
  true,
  'authenticated holds table-level UPDATE privilege, so the denial below comes from RLS'
);
select is(
  has_table_privilege('authenticated', 'public.products', 'DELETE'),
  true,
  'authenticated holds table-level DELETE privilege, so the denial below comes from RLS'
);
select is(
  row_security_active('public.products'),
  true,
  'RLS is active for the authenticated role, so denials are enforced by policies'
);
select throws_ok(
  $$ insert into public.products (name, slug, price, category)
     values ('authenticated inserted product', 'pgtap-authenticated-insert', 1.00, 'pgtap') $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'authenticated non-admin insert is rejected by RLS'
);
select results_eq(
  $$ with changed as (
       update public.products set name = 'tampered by authenticated user'
       where id = '11111111-1111-1111-1111-111111111111'
       returning id
     )
     select id from changed $$,
  $$ select null::uuid where false $$,
  'authenticated non-admin update changes no rows'
);
select results_eq(
  $$ with removed as (
       delete from public.products
       where id = '11111111-1111-1111-1111-111111111111'
       returning id
     )
     select id from removed $$,
  $$ select null::uuid where false $$,
  'authenticated non-admin delete removes no rows'
);

reset role;

select is(
  (select name from public.products where id = '11111111-1111-1111-1111-111111111111'),
  'pgTAP synthetic product',
  'authenticated attempts left the fixture unchanged'
);
select is(
  (select count(*) from public.products where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'authenticated attempts left the fixture in place'
);
select is(
  (select count(*) from public.products
   where slug in ('pgtap-anon-insert', 'pgtap-authenticated-insert')),
  0::bigint,
  'no rejected insert produced a product row'
);

select * from finish();

rollback;
