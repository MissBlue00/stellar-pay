#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "TEST_DATABASE_URL is required for test migrations." >&2
  exit 1
fi

export DATABASE_URL="${TEST_DATABASE_URL}"
export SHADOW_DATABASE_URL="${TEST_SHADOW_DATABASE_URL:-$TEST_DATABASE_URL}"

pnpm exec prisma migrate deploy --schema ./migrations/schema.prisma
pnpm exec prisma generate --schema ./migrations/schema.prisma
pnpm exec prisma db seed --schema ./migrations/schema.prisma
