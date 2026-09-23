# Contributing

Thank you for helping improve Keepalive Worker.

## Development workflow

1. Create a focused branch from the current main branch.
2. Keep changes limited to one concern when practical.
3. Add or update tests for behavior changes.
4. Run `npm run check` and `npm test` locally.
5. Describe security, compatibility, and configuration effects in the pull request.

## Project rules

- Keep every project-owned source or test file at 400 lines or fewer.
- Preserve the small Worker entry point and the existing module boundaries.
- Keep service-specific network behavior under `src/services/`.
- Validate untrusted route inputs before calling an upstream service.
- Never log credentials, authorization headers, or complete client IP addresses.
- Never commit `.dev.vars`, `.env`, production URLs containing credentials, or
  copied provider responses that contain private data.
- Mock outbound requests in tests; automated tests must not call live services.

## Checks

```sh
npm run check
npm test
```

`npm run check` validates JavaScript syntax, enforces the line limit, and scans
text files for common committed-secret formats. A passing scan is helpful but is
not a substitute for reviewing the diff before publishing it.

## Pull requests

Include:

- the reason for the change;
- the observable behavior before and after;
- tests performed;
- any required environment-variable or migration changes.

Do not include real credentials in issues, commits, test fixtures, screenshots,
or pull-request descriptions.
