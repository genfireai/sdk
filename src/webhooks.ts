/**
 * Webhook verification for Genfire deliveries.
 *
 * Every delivery is signed twice (backend services/publicApi/webhookSignatures.ts):
 *
 *   Standard Webhooks:  webhook-id, webhook-timestamp,
 *                       webhook-signature: v1,<base64 HMAC-SHA256(key, "<id>.<ts>.<body>")>
 *                       key = the bytes after `gfwsec_` (base64url) — or a `whsec_` secret's bytes
 *   Legacy:             X-Genfire-Timestamp,
 *                       X-Genfire-Signature: v1=<hex HMAC-SHA256(secret string, "<ts>.<body>")>
 *
 * `verifyWebhook` accepts either and checks the timestamp tolerance. Uses Web
 * Crypto (Node 18+, Deno, Bun, Workers, browsers) — no dependencies.
 *
 *   const event = await verifyWebhook(rawBody, request.headers, process.env.GENFIRE_WEBHOOK_SECRET!);
 *
 * Pass the RAW request body (string or bytes), never a re-serialized object.
 */

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export type WebhookHeaders =
  | Headers
  | Record<string, string | string[] | undefined>
  | Iterable<[string, string]>;

export interface VerifyWebhookOptions {
  /** Max age of `webhook-timestamp` / `X-Genfire-Timestamp`, seconds. Default 300. */
  toleranceSeconds?: number;
  /** Override "now" (unix seconds) — for tests. */
  now?: number;
}

const encoder = new TextEncoder();

function subtle(): SubtleCrypto {
  const value = (globalThis as any).crypto?.subtle as SubtleCrypto | undefined;
  if (!value) throw new WebhookVerificationError('Web Crypto (crypto.subtle) is not available in this runtime.');
  return value;
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The raw key Standard Webhooks signatures use for a Genfire (or whsec_) secret. */
export function standardWebhookKey(secret: string): Uint8Array {
  const value = String(secret || '');
  if (value.startsWith('gfwsec_') && /^[A-Za-z0-9_-]+$/.test(value.slice(7))) return base64ToBytes(value.slice(7));
  if (value.startsWith('whsec_')) return base64ToBytes(value.slice(6));
  return encoder.encode(value);
}

/** The `whsec_…` spelling of a Genfire signing secret, for Standard Webhooks libraries. */
export function toStandardWebhooksSecret(secret: string): string {
  return `whsec_${bytesToBase64(standardWebhookKey(secret))}`;
}

async function hmac(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await subtle().importKey('raw', key as unknown as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await subtle().sign('HMAC', cryptoKey, message as unknown as ArrayBuffer));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function concat(...parts: Array<Uint8Array>): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function headerGetter(headers: WebhookHeaders): (name: string) => string | null {
  if (typeof (headers as Headers).get === 'function') {
    return (name) => (headers as Headers).get(name);
  }
  const map = new Map<string, string>();
  // Plain objects have no iterator; arrays of pairs and Maps do.
  const entries: Iterable<[string, unknown]> = typeof (headers as any)[Symbol.iterator] === 'function'
    ? headers as Iterable<[string, string]>
    : Object.entries(headers as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    map.set(String(key).toLowerCase(), Array.isArray(value) ? String(value[0]) : String(value));
  }
  return (name) => map.get(name.toLowerCase()) ?? null;
}

function bodyBytes(payload: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof payload === 'string') return encoder.encode(payload);
  if (payload instanceof Uint8Array) return payload;
  return new Uint8Array(payload);
}

function checkTimestamp(raw: string, options: VerifyWebhookOptions): void {
  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp)) throw new WebhookVerificationError('Invalid webhook timestamp.');
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const tolerance = options.toleranceSeconds ?? 300;
  if (Math.abs(now - timestamp) > tolerance) throw new WebhookVerificationError('Webhook timestamp is outside the tolerance window.');
}

/** Standard Webhooks check only. Resolves true or throws. */
export async function verifyStandardSignature(
  payload: string | Uint8Array | ArrayBuffer,
  headers: WebhookHeaders,
  secret: string,
  options: VerifyWebhookOptions = {},
): Promise<true> {
  const get = headerGetter(headers);
  const id = get('webhook-id');
  const timestamp = get('webhook-timestamp');
  const signatures = get('webhook-signature');
  if (!id || !timestamp || !signatures) throw new WebhookVerificationError('Missing Standard Webhooks headers.');
  checkTimestamp(timestamp, options);
  const digest = bytesToBase64(await hmac(standardWebhookKey(secret), concat(encoder.encode(`${id}.${timestamp}.`), bodyBytes(payload))));
  const ok = signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',', 2);
    return version === 'v1' && typeof value === 'string' && constantTimeEqual(value, digest);
  });
  if (!ok) throw new WebhookVerificationError('Webhook signature does not match.');
  return true;
}

/** Legacy `X-Genfire-Signature` check only. Resolves true or throws. */
export async function verifyLegacySignature(
  payload: string | Uint8Array | ArrayBuffer,
  headers: WebhookHeaders,
  secret: string,
  options: VerifyWebhookOptions = {},
): Promise<true> {
  const get = headerGetter(headers);
  const timestamp = get('x-genfire-timestamp');
  const signature = get('x-genfire-signature');
  if (!timestamp || !signature) throw new WebhookVerificationError('Missing X-Genfire-Signature headers.');
  checkTimestamp(timestamp, options);
  const digest = bytesToHex(await hmac(encoder.encode(secret), concat(encoder.encode(`${timestamp}.`), bodyBytes(payload))));
  const ok = signature.split(',').map((s) => s.trim()).some((entry) => entry.startsWith('v1=') && constantTimeEqual(entry.slice(3), digest));
  if (!ok) throw new WebhookVerificationError('Webhook signature does not match.');
  return true;
}

/**
 * Verify a delivery (Standard Webhooks headers when present, else the legacy
 * header) and return the parsed event. Throws WebhookVerificationError.
 */
export async function verifyWebhook<T = Record<string, unknown>>(
  payload: string | Uint8Array | ArrayBuffer,
  headers: WebhookHeaders,
  secret: string,
  options: VerifyWebhookOptions = {},
): Promise<T> {
  const get = headerGetter(headers);
  if (get('webhook-signature')) await verifyStandardSignature(payload, headers, secret, options);
  else await verifyLegacySignature(payload, headers, secret, options);
  const text = typeof payload === 'string' ? payload : new TextDecoder().decode(bodyBytes(payload));
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new WebhookVerificationError('Webhook body is not JSON.');
  }
}
