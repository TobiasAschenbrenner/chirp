# Dependency security updates

Reviewed on 19 November 2026 using Node.js 24, matching GitHub Actions.

The previous lockfiles reported 43 frontend and 11 backend dependency findings.
The updated dependency trees report zero findings, including development dependencies.
This records the advisory data available on the review date; dependency audits should
continue to run in CI as new advisories are published.

## Selected versions

- Angular framework and compiler packages: 21.2.26.
- Angular CLI and build tooling: 21.2.30.
- Vitest and its V8 coverage provider: 4.1.12.
- TypeScript ESLint: 8.73.0.
- Mongoose: 8.24.10.

The application stays on Angular 21, TypeScript 5.9, and Mongoose 8. Lockfiles
also refresh affected transitive dependencies within the declared package ranges.

## Temporary transitive overrides

Some upstream tools still request vulnerable glob-matching dependency ranges.
The manifests therefore select patched versions explicitly:

| Package | Frontend | Backend | Reason |
| --- | --- | --- | --- |
| `glob` | `^14.0.6` | — | Angular CLI's npm tooling still requests an affected glob 13 range. |
| `minimatch` | `^11.0.9` | `^11.0.9` | npm tooling and nodemon still request affected minimatch 10 ranges. |

Both patched packages provide CommonJS and ES module entry points and support
Node.js 24. These overrides cross the upstream tools' requested major versions,
so validation includes linting, the application build, full-stack browser tests,
and the backend development watcher's file matching. Remove the overrides once
the parent packages request patched ranges themselves and both audits stay clean.

## Verification

Verified with clean lockfile installs, 181 frontend tests, 31 backend tests,
both Playwright journeys, both lint checks, the production build, and the
development watcher's matching behavior. Both complete dependency audits
reported zero findings, and `npm ls --all` reported no dependency conflicts.

Run from `client`:

```sh
npm ci
npm run lint
npm test -- --watch=false
npx playwright install chromium
npm run test:e2e
npm run build
npm audit
```

Run from `server`:

```sh
npm ci
npm run lint
npm test
npm audit
```

The browser tests use a disposable MongoDB instance through `server/e2e-server.js`;
they do not use the production database.
