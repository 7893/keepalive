# Keepalive Worker

A small Cloudflare Worker that periodically checks Supabase, Oracle Autonomous
Database, and IBM Db2 services. It stores keepalive results and renders a public
status dashboard with masked IP addresses by default.

## Features

- Scheduled and authenticated manual keepalive runs
- Supabase, Oracle ORDS, and IBM Db2 adapters
- Public dashboard and paginated JSON API
- 60-second edge caching and per-client rate limiting for public reads
- Fail-closed administrative routes
- Upstream request timeouts and structured error responses
- Default IP masking and HTML escaping
- Local secret scanning and a 400-line source-file limit

## Architecture

```text
src/
├── index.js              Worker entry point
├── router.js             HTTP routing and validation
├── scheduled.js          Cron execution
├── service-registry.js   Service dispatch and aggregation
├── services/             Supabase, Oracle, and Db2 adapters
└── ui/                   Dashboard markup, styles, and browser script
```

Shared authentication, configuration, environment validation, HTTP helpers,
geolocation, privacy handling, and administrative operations live in focused
modules directly under `src/`.

## Requirements

- Node.js 26.10.0 and npm 11.19.1 (pinned in `.tool-versions` and `package.json`)
- A Cloudflare Workers account and Wrangler CLI for local execution/deployment
- Credentials for only the services you intend to use

The repository has no runtime npm dependencies.

## Local development

```sh
npm ci
cp .env.example .dev.vars
# Replace placeholder values in .dev.vars.
npm run dev
```

Never commit `.dev.vars` or `.env`; both are ignored.

Run all local checks:

```sh
npm run check
npm test
npm run build
```

`npm run build` runs a Wrangler dry-run bundle and never deploys the Worker.

Tests replace outbound `fetch` calls with local mocks and do not contact real
Supabase, Oracle, IBM, or Cloudflare endpoints.

## Configuration

| Variable | Required for | Description |
| --- | --- | --- |
| `TRIGGER_SECRET` | Administrative routes | Long random Bearer token |
| `SUPABASE_URL` | Supabase and Db2 logs | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase and Db2 logs | Server-side Supabase key |
| `OCI_ADB_US_URL` | US Oracle adapter | ORDS base URL |
| `OCI_ADB_US_USER` | US Oracle adapter | ORDS username |
| `OCI_ADB_US_PASS` | US Oracle adapter | ORDS password |
| `OCI_ADB_JP_URL` | Japan Oracle adapter | ORDS base URL |
| `OCI_ADB_JP_USER` | Japan Oracle adapter | ORDS username |
| `OCI_ADB_JP_PASS` | Japan Oracle adapter | ORDS password |
| `IBMCLOUD_API_KEY` | Db2 keepalive | IBM Cloud API key |
| `DB2_DEPLOYMENT_ID` | Db2 keepalive | Db2 deployment identifier |
| `SHOW_FULL_IP` | Optional | Set to `true` only when full public IP output is intentional |
| `USE_REAL_TRACE` | Optional | Use the Worker trace location for scheduled runs |

`DB2_INSTANCE_ID` is accepted as a backward-compatible alternative to
`DB2_DEPLOYMENT_ID`.

### Public endpoint protection

Successful `GET /` and `GET /api/data` responses are cached for 60 seconds in
the Cloudflare data center that handled the request. Cache keys discard unknown
query parameters, normalize page aliases, and keep masked and full-IP output in
separate variants. Error responses and all administrative routes remain
uncached.

The `PUBLIC_RATE_LIMITER` binding allows 120 requests per minute for each
client and public route in a Cloudflare location. Client addresses are hashed
before they are used as limiter keys and are not written to application logs.
The binding fails open if Cloudflare's limiter is temporarily unavailable so
the status page remains reachable. The `namespace_id` in `wrangler.jsonc` must
be unique within the deploying Cloudflare account; change it before deployment
if `7893001` is already used by another Worker rate-limit binding.

## Database initialization

These migrations are bootstrap files for new self-hosted installations. An
existing deployment with working tables does not need to run them again. Review
the SQL against your current schema and permission model before applying it to
an existing database.

Apply the versioned SQL files before the first keepalive run:

- `migrations/supabase/001_create_keepalive_tables.sql` once in Supabase;
- `migrations/oracle/001_create_keepalive_log.sql` in each Oracle database.

Db2 health results are written to Supabase, so no Db2 table is required. See
[migrations/README.md](migrations/README.md) for permissions and verification.

For deployed Workers, store secrets with Wrangler rather than adding values to
`wrangler.jsonc`, for example:

```sh
npx wrangler secret put TRIGGER_SECRET
npx wrangler secret put SUPABASE_SECRET_KEY
```

## HTTP routes

| Route | Method | Authentication | Purpose |
| --- | --- | --- | --- |
| `/` | `GET`, `HEAD` | None | Public dashboard |
| `/api/data?service=...` | `GET` | None | Paginated service data |
| `/debug` | `GET` | Bearer token | Full service diagnostics |
| `/trigger` | `POST` | Bearer token | Manual keepalive run |
| `/admin/clean?action=repair` | `POST` | Bearer token | Repair known bad rows |
| `/admin/clean?action=delete` | `DELETE` | Bearer token | Delete known bad rows |

Supported service names are `supabase`, `adb_us`, `adb_jp`, and `db2`.
Administrative requests use `Authorization: Bearer <TRIGGER_SECRET>`.

## Deployment

Review `wrangler.jsonc` (including the rate-limit namespace), provision every
required secret, run the checks, and then deploy through your normal reviewed
Cloudflare workflow with `npm run deploy`. The configured cron schedules run
three times per day. The compatibility date is `2026-09-23`; updating it takes
effect only on the next deployment.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for development rules. Report security
issues privately as described in [SECURITY.md](SECURITY.md).

## License

Licensed under the [MIT License](LICENSE).
