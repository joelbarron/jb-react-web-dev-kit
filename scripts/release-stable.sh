#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MESSAGE="${1:-chore: add changeset for stable release}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

git fetch origin
git checkout main
git pull --ff-only origin main

echo "Starting Changeset wizard..."
npx changeset add

git add .changeset
if git diff --cached --quiet; then
  echo "No changeset file was created. Aborting."
  exit 1
fi

git commit -m "$COMMIT_MESSAGE"
git push origin main

cat <<'EOF'
Stable release preparation completed.
Next step: merge the `changeset-release/main` PR created by GitHub Actions.
EOF
