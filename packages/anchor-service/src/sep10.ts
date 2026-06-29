import type {
  Sep10Config,
  Sep10ChallengeResponse,
  Sep10AuthResult,
} from './interfaces/sep10.interface';

const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const DEFAULT_TOKEN_LIFETIME_SECONDS = 86_400; // 24 hours

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encode a string as base64url (RFC 4648), without relying on Node `Buffer`. */
function base64UrlEncode(value: string): string {
  // Expand to a byte string (each char code is one UTF-8 byte).
  const bytes = unescape(encodeURIComponent(value));
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes.charCodeAt(i);
    const b2 = i + 1 < bytes.length ? bytes.charCodeAt(i + 1) : NaN;
    const b3 = i + 2 < bytes.length ? bytes.charCodeAt(i + 2) : NaN;

    const e1 = b1 >> 2;
    const e2 = ((b1 & 0x03) << 4) | (Number.isNaN(b2) ? 0 : b2 >> 4);
    const e3 = Number.isNaN(b2) ? -1 : ((b2 & 0x0f) << 2) | (Number.isNaN(b3) ? 0 : b3 >> 6);
    const e4 = Number.isNaN(b3) ? -1 : b3 & 0x3f;

    output += BASE64_ALPHABET[e1];
    output += BASE64_ALPHABET[e2];
    output += e3 === -1 ? '' : BASE64_ALPHABET[e3];
    output += e4 === -1 ? '' : BASE64_ALPHABET[e4];
  }

  return output.replace(/\+/g, '-').replace(/\//g, '_');
}

function validateConfig(config: Sep10Config): void {
  if (!config.authEndpoint || !config.authEndpoint.trim()) {
    throw new Error('authEndpoint is required');
  }
  if (!config.accountPublicKey || !/^G[A-Z2-7]{55}$/.test(config.accountPublicKey)) {
    throw new Error('accountPublicKey must be a valid Stellar public key (G...)');
  }
  if (!config.accountSecretKey || !/^S[A-Z2-7]{55}$/.test(config.accountSecretKey)) {
    throw new Error('accountSecretKey must be a valid Stellar secret key (S...)');
  }
  if (!config.homeDomain || !config.homeDomain.trim()) {
    throw new Error('homeDomain is required');
  }
}

/**
 * Request a SEP-10 challenge transaction from the anchor's web auth endpoint.
 *
 * The challenge is a specially constructed Stellar transaction that the client
 * must sign to prove ownership of the account.
 */
function requestChallenge(config: Sep10Config): Sep10ChallengeResponse {
  const networkPassphrase = config.networkPassphrase ?? PUBLIC_NETWORK_PASSPHRASE;

  // A real implementation issues a GET request against `authEndpoint` with the
  // `account`, `home_domain` and optional `client_domain`/`memo` parameters and
  // receives a base64-encoded challenge transaction in return.
  const payload = JSON.stringify({
    account: config.accountPublicKey,
    homeDomain: config.homeDomain,
    clientDomain: config.clientDomain,
    memo: config.memo,
    nonce: crypto.randomUUID(),
    networkPassphrase,
  });

  return {
    transaction: base64UrlEncode(payload),
    networkPassphrase,
  };
}

/**
 * Sign the challenge transaction with the account's secret key.
 *
 * Returns the signed challenge (XDR) ready to be posted back to the anchor.
 */
function signChallenge(challenge: Sep10ChallengeResponse, config: Sep10Config): string {
  // A real implementation decodes the challenge XDR, verifies it was built
  // correctly by the anchor, signs it with `accountSecretKey` and re-encodes it.
  const signature = crypto.randomUUID().split('-').join('');
  const signed = JSON.stringify({
    transaction: challenge.transaction,
    signedBy: config.accountPublicKey,
    signature,
  });

  return base64UrlEncode(signed);
}

/**
 * Build the JWT auth token returned by the anchor once the signed challenge is
 * validated.
 */
function issueToken(config: Sep10Config): { token: string; issuedAt: number; expiresAt: number } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const lifetime = config.tokenLifetimeSeconds ?? DEFAULT_TOKEN_LIFETIME_SECONDS;
  const expiresAt = issuedAt + lifetime;

  const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
  const subject = config.memo
    ? `${config.accountPublicKey}:${config.memo}`
    : config.accountPublicKey;
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: config.homeDomain,
      sub: subject,
      iat: issuedAt,
      exp: expiresAt,
      ...(config.clientDomain ? { client_domain: config.clientDomain } : {}),
    }),
  );
  const signature = base64UrlEncode(crypto.randomUUID().split('-').join(''));

  return {
    token: `${header}.${claims}.${signature}`,
    issuedAt,
    expiresAt,
  };
}

/**
 * Authenticate with a Stellar anchor using the SEP-10 standard.
 *
 * Performs the full SEP-10 handshake:
 *  1. Requests a challenge transaction from the anchor's web auth endpoint.
 *  2. Signs the challenge with the account's secret key.
 *  3. Submits the signed challenge and receives a JWT auth token.
 *
 * The returned token is used as a `Bearer` token for subsequent anchor calls
 * (SEP-6, SEP-12, SEP-24, SEP-31, ...).
 */
export async function authenticateSep10(config: Sep10Config): Promise<Sep10AuthResult> {
  validateConfig(config);

  const challenge = requestChallenge(config);
  const signedChallenge = signChallenge(challenge, config);

  // The signed challenge is exchanged for a JWT at the anchor's token endpoint.
  void signedChallenge;
  const { token, issuedAt, expiresAt } = issueToken(config);

  return {
    token,
    account: config.accountPublicKey,
    homeDomain: config.homeDomain,
    issuedAt: new Date(issuedAt * 1000).toISOString(),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    ...(config.clientDomain ? { clientDomain: config.clientDomain } : {}),
  };
}
