# 🚀 Stellar Pay Development Setup

## Quick Start

This monorepo contains multiple services that should run in separate terminal sessions to avoid resource contention and lock file conflicts.

### Recommended Setup (3 Terminal Windows)

#### Terminal 1: API Server

```bash
pnpm run dev:api
# Runs on http://localhost:3001
```

#### Terminal 2: Frontend Application

```bash
pnpm run dev:frontend
# Runs on http://localhost:3000
```

#### Terminal 3: Admin Dashboard (Optional)

```bash
pnpm run dev:admin
# Runs on http://localhost:3002
```

---

## Alternative: Single Terminal with Background Processes

```bash
# Start all services in background (useful for CI or testing)
pnpm run dev
```

This runs all dev servers once. For persistent development, use the 3-terminal setup above.

---

## Why Separate Terminals?

**Architecture Principle**: Each development service is independent and long-lived.

**Technical Reason**: Next.js uses `.next/dev/lock` files to prevent concurrent instances. Running multiple Next.js apps simultaneously in one Turbo process creates race conditions on these lock files.

**Best Practice**: Monorepo development typically focuses on one or two services at a time. Separate terminals allow you to:

- Monitor logs for each service independently
- Restart individual services without affecting others
- Work on frontend while API runs in background
- Avoid resource contention and port conflicts

---

## Configuration Details

| Service         | Port | Command                 | Notes                     |
| --------------- | ---- | ----------------------- | ------------------------- |
| API             | 3001 | `pnpm run dev:api`      | NestJS with watch mode    |
| Frontend        | 3000 | `pnpm run dev:frontend` | Next.js 16 with Turbopack |
| Admin Dashboard | 3002 | `pnpm run dev:admin`    | Next.js 16 with Turbopack |

---

## Environment Files

Each service has a `.env` file for configuration:

### `apps/api/.env`

```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SUPPORTED_ASSETS=USDC,ARS,BRL,COP,MXN,XLM
```

### Frontend Services

No `.env` needed for basic local development. API URL defaults to `http://localhost:3001`.

---

## Testing the Payment Endpoint

With API running on Terminal 1:

```bash
# Check API health
curl http://localhost:3001/health

# Create payment intent (requires JWT token)
curl -X POST http://localhost:3001/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "asset": "USDC",
    "description": "Test payment"
  }'
```

---

## Troubleshooting

### `.next/dev/lock` Errors

If you see "Unable to acquire lock" errors:

```bash
# Kill all Node processes
pkill -9 node

# Remove lock files
rm -rf apps/frontend/.next apps/admin-dashboard/.next

# Restart services in separate terminals
```

### Port Already in Use

Frontend is on 3000, Admin on 3002, API on 3001. If ports conflict:

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### TypeScript Errors

Update type definitions:

```bash
pnpm install
pnpm typecheck
```

---

## Available Commands

```bash
# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Run all tests
pnpm test

# Format code
pnpm format
```

---

## Engineering Principles

This setup follows:

- **Separation of Concerns**: Each service runs independently
- **Unix Philosophy**: Tools do one thing well
- **Monorepo Best Practices**: Shared dependencies, separate service lifecycles
- **Developer Experience**: Clear, simple commands with good logging
