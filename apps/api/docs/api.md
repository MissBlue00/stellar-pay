# Stellar Pay API Reference

## Authentication

Most endpoints require JWT bearer authentication via `Authorization: Bearer <token>` header.

---

## API Keys

### Generate an API Key

```
POST /apikeys
```

Generate a new cryptographically secure API key for server-to-server integrations. The plaintext key is returned **only once** in the response. Store it securely — it cannot be retrieved later.

**Authentication:** JWT required (`Authorization: Bearer <token>`)

**Response `201 Created`:**

```json
{
  "id": "uuid",
  "api_key": "sp_live_<64-hex-chars>",
  "prefix": "sp_live_",
  "created_at": "2026-05-31T00:00:00.000Z"
}
```

Key format:

- 32 bytes of cryptographically random data, hex-encoded (64 characters)
- Prefixed with `sp_live_`
- Only the SHA256 hash of the key is stored in the database

---

## Health Checks

Health check endpoints are public and do not require JWT authentication. They return
Nest Terminus-compatible JSON with an overall `status`, per-indicator `info` for
healthy checks, and `error` / `details` entries when a check fails.

### Check API Health

```
GET /health
```

Runs the API health check suite and reports the current status of:

- `database`
- `redis`
- `blockchain_rpc`
- `treasury_wallet`

**Authentication:** Not required

**Response `200 OK`:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "blockchain_rpc": {
      "status": "up"
    },
    "treasury_wallet": {
      "status": "up",
      "assetCode": "USDC",
      "treasuryAddress": "G...",
      "currentBalance": "1000.0000000",
      "minimumBalance": "0"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "blockchain_rpc": {
      "status": "up"
    },
    "treasury_wallet": {
      "status": "up",
      "assetCode": "USDC",
      "treasuryAddress": "G...",
      "currentBalance": "1000.0000000",
      "minimumBalance": "0"
    }
  }
}
```

**Response `503 Service Unavailable`:**

```json
{
  "status": "error",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "blockchain_rpc": {
      "status": "up"
    }
  },
  "error": {
    "treasury_wallet": {
      "status": "down",
      "message": "Missing TREASURY_WALLET_ADDRESS"
    }
  },
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "blockchain_rpc": {
      "status": "up"
    },
    "treasury_wallet": {
      "status": "down",
      "message": "Missing TREASURY_WALLET_ADDRESS"
    }
  }
}
```

### Indicator Response Fields

The aggregate `/health` response contains the following indicator keys:

| Indicator | Description | Healthy response | Failure response |
| --- | --- | --- | --- |
| `database` | Database connectivity check. | `{ "status": "up" }` | `{ "status": "down", "message": "Database connection unavailable" }` |
| `redis` | Redis connectivity check. | `{ "status": "up" }` | `{ "status": "down", "message": "Redis connection unavailable" }` |
| `blockchain_rpc` | Stellar RPC availability check. | `{ "status": "up" }` | `{ "status": "down", "message": "Stellar RPC unavailable" }` |
| `treasury_wallet` | Treasury wallet balance threshold check. | `{ "status": "up", "assetCode": "USDC", "treasuryAddress": "G...", "currentBalance": "1000.0000000", "minimumBalance": "0" }` | `{ "status": "down", "message": "Missing TREASURY_WALLET_ADDRESS" }` |

> Note: the current API exposes these checks through the aggregate
> `GET /health` route. Dedicated routes such as `/health/database`,
> `/health/redis`, `/health/blockchain`, and `/health/treasury` are not
> currently registered by `HealthController`.
