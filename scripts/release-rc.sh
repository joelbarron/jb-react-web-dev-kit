#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

git fetch origin

if [ ! -f ".changeset/pre.json" ]; then
  echo "Missing .changeset/pre.json. Initialize prerelease mode on branch 'next' first."
  exit 1
fi

git checkout next
git pull --ff-only origin next
git merge --no-ff --no-edit origin/main
git push origin next

cat <<'EOF'
RC release preparation completed.
Next step: merge the `changeset-release/next` PR created by GitHub Actions.
EOF
