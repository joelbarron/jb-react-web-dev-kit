# Release Guide (npm + Changesets)

This project uses Changesets with two channels:
- `latest` from branch `main` (stable)
- `next` from branch `next` (rc prerelease)

## One-time setup

1. Configure npm Trusted Publisher for package `@joelbarron/react-web-dev-kit`.
2. Point it to this GitHub repository and workflow file `.github/workflows/release.yml`.
3. Remove `NPM_TOKEN` from repository secrets after Trusted Publisher is validated.

Why: publish now uses OIDC (`id-token: write`) and no npm token.

## Branch bootstrap for prerelease channel

Run once to initialize `next` in prerelease mode:

```bash
git checkout main
git pull
git checkout -b next
npx changeset pre enter rc
git add .changeset/pre.json
git commit -m "chore: enter rc prerelease mode on next"
git push -u origin next
```

Do not commit `.changeset/pre.json` into `main`.

## Daily release flow

1. Add a changeset file for each user-facing change.
2. Merge feature PRs to `main`.
3. Stable release:
   - Workflow updates/creates `changeset-release/main`.
   - Merge that PR to publish to npm tag `latest`.
4. RC release:
   - Sync `next` with `main` via PR.
   - Workflow updates/creates `changeset-release/next`.
   - Merge that PR to publish prerelease (`-rc.x`) with npm tag `next`.

## Validation

Check tags and versions:

```bash
npm view @joelbarron/react-web-dev-kit version dist-tags --json
```

Expected:
- `latest` remains stable
- `next` points to the newest rc prerelease
