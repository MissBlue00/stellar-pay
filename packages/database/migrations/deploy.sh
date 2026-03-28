#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for migration deployment." >&2
  exit 1
fi

pnpm exec prisma migrate deploy --schema ./migrations/schema.prisma
pnpm exec prisma generate --schema ./migrations/schema.prisma
