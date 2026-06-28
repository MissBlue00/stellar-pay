export interface Sep10Config {
  /** The anchor's SEP-10 web auth endpoint (WEB_AUTH_ENDPOINT). */
  authEndpoint: string;
  /** The Stellar account public key (`G...`) being authenticated. */
  accountPublicKey: string;
  /** The Stellar account secret key (`S...`) used to sign the challenge. */
  accountSecretKey: string;
  /** The home domain of the anchor, included in the challenge request. */
  homeDomain: string;
  /** Optional client domain for SEP-10 client attribution. */
  clientDomain?: string;
  /** Optional memo id for shared/custodial accounts. */
  memo?: string;
  /** Network passphrase. Defaults to the Stellar public network. */
  networkPassphrase?: string;
  /** Lifetime of the issued auth token in seconds. Defaults to 86400 (24h). */
  tokenLifetimeSeconds?: number;
}

export interface Sep10ChallengeResponse {
  /** Base64-encoded challenge transaction (XDR) returned by the anchor. */
  transaction: string;
  /** Network passphrase the challenge was built for. */
  networkPassphrase: string;
}

export interface Sep10AuthResult {
  /** The JWT auth token to be used as a Bearer token on subsequent anchor calls. */
  token: string;
  /** The authenticated account public key. */
  account: string;
  /** The home domain the token was issued for. */
  homeDomain: string;
  /** ISO timestamp of when the token was issued. */
  issuedAt: string;
  /** ISO timestamp of when the token expires. */
  expiresAt: string;
  /** The client domain, when one was supplied. */
  clientDomain?: string;
}
