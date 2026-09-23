# Database initialization

> These migrations are for new self-hosted installations. Do not run them on an
> existing production database unless you have reviewed the schema and grants
> and intentionally want to reconcile that deployment.

The Worker stores Supabase and Db2 health events in Supabase. Oracle health
events are stored in each Oracle database through ORDS.

## Supabase

Run `supabase/001_create_keepalive_tables.sql` once in the Supabase SQL editor.
It creates:

- `public.my_keepalive_logs` for Supabase keepalive events;
- `public.db2_keepalive_logs` for IBM Db2 health events;
- descending timestamp indexes used by dashboard queries.

Row-level security is enabled without public policies. The migration revokes
table access from `anon` and `authenticated` and grants the required operations
to `service_role`. Configure the Worker with a server-side Supabase secret; do
not use an anonymous browser key.

The sequence grant uses `all sequences in schema public` so both identity
columns work. If the schema contains unrelated sequences and your policy
requires narrower grants, replace it with grants for the two generated identity
sequences shown by the Supabase SQL editor after table creation.

## Oracle Autonomous Database

Run `oracle/001_create_keepalive_log.sql` separately in both the US and Japan
databases. Use the same schema account that the corresponding ORDS credentials
expose. The script is idempotent: existing-table and existing-index errors are
ignored while other Oracle errors are raised.

The Worker requires ORDS access to:

- read database status;
- insert and select `keepalive_log` rows;
- update or delete known bad rows through authenticated maintenance routes.

If a DBA owns the table in another schema, create a synonym and grant only
`select`, `insert`, `update`, and `delete` on `keepalive_log` to the ORDS user.

## IBM Db2

No table is created inside Db2. The Worker calls the IBM deployment health API
and records the result in Supabase's `db2_keepalive_logs` table.

## Verification

After applying migrations, configure local placeholder-derived credentials in
`.dev.vars`, start `wrangler dev`, and invoke `/trigger` with a valid Bearer
token. Do not use production credentials in committed files or test fixtures.
