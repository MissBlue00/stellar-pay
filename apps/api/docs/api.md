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
