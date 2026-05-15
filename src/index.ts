export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type GenFireScope =
  | '*'
  | 'account:read'
  | 'credits:read'
  | 'models:read'
  | 'runs:read'
  | 'batches:read'
  | 'batches:write'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'images:write'
  | 'videos:write'
  | 'audio:write'
  | 'lipsync:write'
  | 'products:write'
  | 'workflows:read'
  | 'workflows:write'
  | 'uploads:write'
  | 'influencers:read';

export type RunStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type BatchStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'partial';
export type BatchMode = 'workflow' | 'operation';
export type BatchItemStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type WebhookEventType = 'run.completed' | 'run.failed' | 'batch.completed' | 'batch.failed';
export type WebhookStatus = 'active' | 'disabled';
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';
export type CredentialType = 'api_key' | 'access_token';

export interface GenFireClientConfig {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  fetch?: FetchLike;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  idempotencyKey?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface ListRunsParams {
  status?: RunStatus;
  capability?: string;
  limit?: number;
}

export interface ListBatchesParams {
  status?: BatchStatus;
  mode?: BatchMode;
  target?: string;
  limit?: number;
}

export interface ListWebhookDeliveriesParams {
  endpointId?: string;
  limit?: number;
}

export interface OAuthTokenRequest {
  clientId: string;
  clientSecret: string;
  scope?: string;
  baseUrl?: string;
  fetch?: FetchLike;
  signal?: AbortSignal;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface ApiErrorPayload {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  request_id: string;
}

export class GenFireApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly type: string;
  readonly requestId: string | null;
  readonly payload: ApiErrorPayload | Record<string, unknown>;

  constructor(payload: ApiErrorPayload | Record<string, unknown>, fallbackStatus: number) {
    const detail = typeof (payload as ApiErrorPayload).detail === 'string'
      ? (payload as ApiErrorPayload).detail
      : `GenFire API request failed with status ${fallbackStatus}`;
    super(detail);
    this.name = 'GenFireApiError';
    this.status = typeof (payload as ApiErrorPayload).status === 'number'
      ? (payload as ApiErrorPayload).status
      : fallbackStatus;
    this.code = typeof (payload as ApiErrorPayload).code === 'string'
      ? (payload as ApiErrorPayload).code
      : 'request_failed';
    this.type = typeof (payload as ApiErrorPayload).type === 'string'
      ? (payload as ApiErrorPayload).type
      : 'about:blank';
    this.requestId = typeof (payload as ApiErrorPayload).request_id === 'string'
      ? (payload as ApiErrorPayload).request_id
      : null;
    this.payload = payload;
  }
}

export interface Account {
  id: string;
  object: 'account';
  display_name: string;
  email: string;
  plan: string;
  status: 'active';
  created_at: string;
  updated_at: string;
}

export interface CreditBalance {
  account_id: string;
  balance: number;
  currency: 'credits';
}

export interface ModelCapabilities {
  text_to_output: boolean;
  image_to_output: boolean;
  reference_images: boolean;
  source_video: boolean;
  motion_control: boolean;
  first_last_frame: boolean;
}

export interface Model {
  id: string;
  object: 'model';
  capability: string;
  name: string;
  description: string;
  status: 'available';
  is_default: boolean;
  limits: Record<string, unknown>;
  capabilities?: ModelCapabilities;
}

export interface PricingEntry {
  model: string;
  capability: string;
  unit: string;
  credits: number;
  operation_key: string;
  notes?: string;
}

export interface Workflow {
  id: string;
  object: 'workflow';
  name: string;
  description: string;
  status: 'available';
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

export interface RunError {
  code: string;
  message: string;
}

export interface Run {
  id: string;
  object: 'run';
  status: RunStatus;
  capability: string;
  endpoint: string;
  model: string | null;
  request_id: string;
  input_summary: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  error: RunError | null;
  resource_id: string | null;
  provider_request_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface RunOutput {
  id: string;
  object: 'run_output';
  status: RunStatus;
  capability: string;
  output: Record<string, unknown> | null;
  error: RunError | null;
  completed_at: string | null;
}

export interface Batch {
  id: string;
  object: 'batch';
  mode: BatchMode;
  target: string;
  status: BatchStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  concurrency: number;
  input_summary: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: RunError | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BatchItem {
  id: string;
  object: 'batch_item';
  batch_id: string;
  index: number;
  target: string;
  status: BatchItemStatus;
  run_id: string | null;
  input_summary: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: RunError | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BatchWithItems extends Batch {
  items: BatchItem[];
}

export interface WebhookEndpoint {
  id: string;
  object: 'webhook_endpoint';
  url: string;
  description: string | null;
  status: WebhookStatus;
  events: WebhookEventType[];
  signing_secret_preview: string;
  created_at: string;
  updated_at: string;
  last_delivery_at: string | null;
}

export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  signing_secret: string;
}

export interface WebhookDelivery {
  id: string;
  object: 'webhook_delivery';
  endpoint_id: string;
  event_type: WebhookEventType;
  run_id: string | null;
  batch_id: string | null;
  status: WebhookDeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  response_status: number | null;
  response_body: string | null;
  last_error: string | null;
  request_headers: Record<string, string>;
  created_at: string;
  updated_at: string;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  delivered_at: string | null;
}

export interface ListResponse<T> {
  object: 'list';
  data: T[];
}

export interface InfluencerMention {
  handle: string;
  influencer_id: string;
}

export interface CreateImageGenerationRequest {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  count?: number;
  image_url?: string;
  /** image.gpt_image_2 only. One of: low, medium, high, auto. Defaults to high. */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /** Nano Banana family edit only (image.nano_banana, image.nano_banana_2, image.nano_banana_pro) — request must include image_url or mentions. One of: 1K, 2K, 4K. */
  resolution?: '1K' | '2K' | '4K';
  /**
   * Optional `[{ handle, influencer_id }]`. When supplied, the model auto-switches
   * to its edit variant and the influencer's reference photos are injected as
   * conditioning. Currently a single mention per request is supported.
   */
  mentions?: InfluencerMention[];
}

export type InfluencerStatus = 'draft' | 'ready' | 'archived';
export type InfluencerSourceType = 'uploaded' | 'generated';

export interface Influencer {
  id: string;
  object: 'influencer';
  handle: string;
  display_name: string;
  status: InfluencerStatus;
  source_type: InfluencerSourceType;
  preview_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Voice {
  /** Pass this as `voice_id` to createSpeech(). Cloned voices look like `fal_cloned_<id>`. */
  id: string;
  object: 'voice';
  name: string;
  /** `cloned` = a voice you cloned; `stock` = a built-in ElevenLabs voice. */
  type: 'cloned' | 'stock';
  provider: string;
  preview_url: string | null;
  created_at: string | null;
}

export interface ListVoicesOptions {
  /** Set to true to also include built-in ElevenLabs stock voices. */
  includeStock?: boolean;
  signal?: AbortSignal;
}

export interface CreateVideoGenerationRequest {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  duration?: number;
  image_url?: string;
  generate_audio?: boolean;
}

export interface CreateLipsyncGenerationRequest {
  video_url: string;
  audio_url?: string;
  audio_base64?: string;
  audio_file_name?: string;
  title?: string;
  description?: string;
  sync_mode?: 'cut_off' | 'loop' | 'bounce' | 'silence' | 'remap';
  model?: string;
  duration?: number;
}

export interface CreateSpeechRequest {
  text: string;
  voice_id: string;
  model?: string;
  voice_name?: string;
  output_format?: string;
}

export interface CreateMusicRequest {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  include_details?: boolean;
  with_timestamps?: boolean;
  force_instrumental?: boolean;
  output_format?: string;
}

export interface CreateSoundEffectRequest {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  output_format?: string;
  prompt_influence?: number;
  loop?: boolean;
}

export interface CreateTranscriptionRequest {
  /** Direct audio file URL. Provide exactly one of audio_url / video_url / youtube_url. */
  audio_url?: string;
  /** Direct video file URL; audio is extracted before transcription. */
  video_url?: string;
  /** A YouTube URL to download and transcribe (max 2 hours). */
  youtube_url?: string;
  /** Optional transcription model alias (defaults to transcription.whisper_v1). */
  model?: string;
}

/** Shape of `run.output` for a completed transcription run. */
export interface TranscriptionOutput {
  transcript_id: string | null;
  text: string;
  language: string | null;
  duration: number | null;
  words: Array<{ word: string; start: number; end: number; probability?: number }>;
  segments: Array<{ id: number; start: number; end: number; text: string }>;
  audio_url: string | null;
}

export interface ExtractProductRequest {
  url: string;
}

export interface BatchRequestItem {
  input: Record<string, unknown>;
}

export interface CreateBatchRequest {
  mode: BatchMode;
  target: string;
  concurrency?: number;
  items: BatchRequestItem[];
}

export interface CreateWebhookRequest {
  url: string;
  description?: string;
  events?: WebhookEventType[];
}

export interface UpdateWebhookRequest {
  url?: string;
  description?: string | null;
  status?: WebhookStatus;
  events?: WebhookEventType[];
}

export interface WaitForRunOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface CreateUploadRequest {
  filename: string;
  content_type?: string;
  size_bytes?: number;
}

export interface Upload {
  asset_id: string;
  upload_url: string;
  asset_url: string;
  content_type: string;
  expires_at: string;
}

export interface UploadFileOptions {
  filename?: string;
  contentType?: string;
  signal?: AbortSignal;
}

export type CliAuthSessionStatus = 'pending' | 'approved' | 'consumed' | 'denied' | 'expired';

export interface StartCliAuthSessionRequest {
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scopes?: GenFireScope[];
  label?: string;
  baseUrl?: string;
  fetch?: FetchLike;
  signal?: AbortSignal;
}

export interface StartCliAuthSessionResponse {
  session_id: string;
  verification_url: string;
  expires_at: string;
  requested_scopes: GenFireScope[];
  label: string;
}

export interface CliAuthSessionStatusResponse {
  session_id: string;
  status: CliAuthSessionStatus;
  label: string;
  requested_scopes: GenFireScope[];
  expires_at: string;
}

export interface ExchangeCliAuthSessionRequest {
  sessionId: string;
  codeVerifier: string;
  baseUrl?: string;
  fetch?: FetchLike;
  signal?: AbortSignal;
}

export interface ExchangeCliAuthSessionResponse {
  api_key: string;
  scopes: GenFireScope[];
  label: string;
  session_expires_at: string;
}

function resolveFetch(customFetch?: FetchLike): FetchLike {
  if (customFetch) return customFetch;
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation available. Provide `fetch` in the client config.');
  }
  return fetch.bind(globalThis);
}

function normalizeBaseUrl(baseUrl?: string): string {
  const value = (baseUrl || 'https://api.genfire.ai/v1').trim();
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };

    const cleanup = () => {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    if (signal) {
      if (signal.aborted) {
        cleanup();
        reject(new DOMException('The operation was aborted.', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new GenFireApiError(data, response.status);
  }

  return data as T;
}

export async function createOAuthAccessToken(input: OAuthTokenRequest): Promise<OAuthTokenResponse> {
  const fetchImpl = resolveFetch(input.fetch);
  const response = await fetchImpl(joinUrl(normalizeBaseUrl(input.baseUrl), '/oauth/token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: input.clientId,
      client_secret: input.clientSecret,
      ...(input.scope ? { scope: input.scope } : {})
    }),
    signal: input.signal
  });

  return parseResponse<OAuthTokenResponse>(response);
}

export async function startCliAuthSession(input: StartCliAuthSessionRequest): Promise<StartCliAuthSessionResponse> {
  const fetchImpl = resolveFetch(input.fetch);
  const response = await fetchImpl(joinUrl(normalizeBaseUrl(input.baseUrl), '/cli/auth/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: input.clientId,
      code_challenge: input.codeChallenge,
      code_challenge_method: input.codeChallengeMethod,
      ...(input.scopes ? { scopes: input.scopes } : {}),
      ...(input.label ? { label: input.label } : {})
    }),
    signal: input.signal
  });
  return parseResponse<StartCliAuthSessionResponse>(response);
}

export async function getCliAuthSession(sessionId: string, options: { baseUrl?: string; fetch?: FetchLike; signal?: AbortSignal } = {}): Promise<CliAuthSessionStatusResponse> {
  const fetchImpl = resolveFetch(options.fetch);
  const response = await fetchImpl(
    joinUrl(normalizeBaseUrl(options.baseUrl), `/cli/auth/sessions/${encodeURIComponent(sessionId)}`),
    { method: 'GET', signal: options.signal }
  );
  return parseResponse<CliAuthSessionStatusResponse>(response);
}

export async function exchangeCliAuthSession(input: ExchangeCliAuthSessionRequest): Promise<ExchangeCliAuthSessionResponse> {
  const fetchImpl = resolveFetch(input.fetch);
  const response = await fetchImpl(
    joinUrl(normalizeBaseUrl(input.baseUrl), `/cli/auth/sessions/${encodeURIComponent(input.sessionId)}/exchange`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code_verifier: input.codeVerifier }),
      signal: input.signal
    }
  );
  return parseResponse<ExchangeCliAuthSessionResponse>(response);
}

export class GenFireClient {
  readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: FetchLike;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: GenFireClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.token = (config.apiKey || config.accessToken || '').trim();
    this.fetchImpl = resolveFetch(config.fetch);
    this.defaultHeaders = config.headers || {};

    if (!this.token) {
      throw new Error('Provide `apiKey` or `accessToken` when creating GenFireClient.');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: {
      query?: Record<string, string | number | undefined | null>;
      body?: unknown;
      idempotencyKey?: string;
      signal?: AbortSignal;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, `${path}${buildQuery(options.query || {})}`);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      ...this.defaultHeaders,
      ...(options.headers || {})
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body,
      signal: options.signal
    });

    return parseResponse<T>(response);
  }

  getAccount(signal?: AbortSignal): Promise<Account> {
    return this.request<Account>('GET', '/account', { signal });
  }

  getCredits(signal?: AbortSignal): Promise<CreditBalance> {
    return this.request<CreditBalance>('GET', '/account/credits', { signal });
  }

  listPricing(signal?: AbortSignal): Promise<ListResponse<PricingEntry>> {
    return this.request<ListResponse<PricingEntry>>('GET', '/models/pricing', { signal });
  }

  listModels(signal?: AbortSignal): Promise<ListResponse<Model>> {
    return this.request<ListResponse<Model>>('GET', '/models', { signal });
  }

  /**
   * List the voices you can pass to {@link createSpeech} as `voice_id`.
   * Returns your cloned voices by default; pass `{ includeStock: true }` to
   * also include built-in ElevenLabs stock voices.
   */
  listVoices(options: ListVoicesOptions = {}): Promise<ListResponse<Voice>> {
    const path = options.includeStock ? '/audio/voices?include=stock' : '/audio/voices';
    return this.request<ListResponse<Voice>>('GET', path, { signal: options.signal });
  }

  listInfluencers(signal?: AbortSignal): Promise<ListResponse<Influencer>> {
    return this.request<ListResponse<Influencer>>('GET', '/influencers', { signal });
  }

  getInfluencer(influencerId: string, signal?: AbortSignal): Promise<Influencer> {
    return this.request<Influencer>('GET', `/influencers/${encodeURIComponent(influencerId)}`, { signal });
  }

  listRuns(params: ListRunsParams = {}, signal?: AbortSignal): Promise<ListResponse<Run>> {
    return this.request<ListResponse<Run>>('GET', '/runs', {
      query: {
        status: params.status,
        capability: params.capability,
        limit: params.limit
      },
      signal
    });
  }

  getRun(runId: string, signal?: AbortSignal): Promise<Run> {
    return this.request<Run>('GET', `/runs/${encodeURIComponent(runId)}`, { signal });
  }

  getRunOutput(runId: string, signal?: AbortSignal): Promise<RunOutput> {
    return this.request<RunOutput>('GET', `/runs/${encodeURIComponent(runId)}/output`, { signal });
  }

  async waitForRun(runId: string, options: WaitForRunOptions = {}): Promise<Run> {
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 5_000;
    const startedAt = Date.now();

    while (true) {
      const run = await this.getRun(runId, options.signal);
      if (run.status === 'completed' || run.status === 'failed') {
        return run;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(`Timed out waiting for run ${runId}.`);
      }

      await sleep(intervalMs, options.signal);
    }
  }

  listBatches(params: ListBatchesParams = {}, signal?: AbortSignal): Promise<ListResponse<Batch>> {
    return this.request<ListResponse<Batch>>('GET', '/batches', {
      query: {
        status: params.status,
        mode: params.mode,
        target: params.target,
        limit: params.limit
      },
      signal
    });
  }

  getBatch(batchId: string, signal?: AbortSignal): Promise<Batch> {
    return this.request<Batch>('GET', `/batches/${encodeURIComponent(batchId)}`, { signal });
  }

  listBatchItems(batchId: string, signal?: AbortSignal): Promise<ListResponse<BatchItem>> {
    return this.request<ListResponse<BatchItem>>('GET', `/batches/${encodeURIComponent(batchId)}/items`, { signal });
  }

  createBatch(input: CreateBatchRequest, options: RequestOptions = {}): Promise<BatchWithItems> {
    return this.request<BatchWithItems>('POST', '/batches', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createUpload(input: CreateUploadRequest, options: RequestOptions = {}): Promise<Upload> {
    return this.request<Upload>('POST', '/uploads', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  async uploadFile(source: string | Blob | Uint8Array, options: UploadFileOptions = {}): Promise<Upload> {
    const { filename, contentType, signal } = options;

    let body: Blob | Uint8Array;
    let resolvedFilename: string;
    let resolvedContentType: string | undefined = contentType;
    let sizeBytes: number;

    if (typeof source === 'string') {
      const { readFile } = await import('node:fs/promises');
      const { basename } = await import('node:path');
      const buffer = await readFile(source);
      body = buffer;
      sizeBytes = buffer.byteLength;
      resolvedFilename = filename || basename(source);
    } else if (source instanceof Uint8Array) {
      body = source;
      sizeBytes = source.byteLength;
      if (!filename) {
        throw new Error('filename is required when uploading a Uint8Array.');
      }
      resolvedFilename = filename;
    } else {
      body = source;
      sizeBytes = source.size;
      resolvedFilename = filename || (source as any).name || 'upload';
      resolvedContentType = resolvedContentType || source.type || undefined;
    }

    const upload = await this.createUpload({
      filename: resolvedFilename,
      content_type: resolvedContentType,
      size_bytes: sizeBytes
    }, { signal });

    const putResponse = await this.fetchImpl(upload.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': upload.content_type },
      body: body as any,
      signal
    });

    if (!putResponse.ok) {
      throw new Error(`Upload PUT failed with status ${putResponse.status}.`);
    }

    return upload;
  }

  listWorkflows(signal?: AbortSignal): Promise<ListResponse<Workflow>> {
    return this.request<ListResponse<Workflow>>('GET', '/workflows', { signal });
  }

  getWorkflow(workflowKey: string, signal?: AbortSignal): Promise<Workflow> {
    return this.request<Workflow>('GET', `/workflows/${encodeURIComponent(workflowKey)}`, { signal });
  }

  runWorkflow<TInput extends Record<string, unknown>>(workflowKey: string, input: TInput, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', `/workflows/${encodeURIComponent(workflowKey)}/runs`, {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createImageGeneration(input: CreateImageGenerationRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/images/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createVideoGeneration(input: CreateVideoGenerationRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/videos/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createLipsyncGeneration(input: CreateLipsyncGenerationRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/lipsync/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createSpeech(input: CreateSpeechRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/audio/speech', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createMusic(input: CreateMusicRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/audio/music', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  createSoundEffect(input: CreateSoundEffectRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/audio/sfx', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Transcribe audio or video to text (OpenAI Whisper) with word/segment
   * timestamps. Async — returns a Run; poll it until completed, then read
   * `run.output` (see {@link TranscriptionOutput}).
   */
  createTranscription(input: CreateTranscriptionRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/audio/transcriptions', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  extractProduct(input: ExtractProductRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/products/extract', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  listWebhooks(signal?: AbortSignal): Promise<ListResponse<WebhookEndpoint>> {
    return this.request<ListResponse<WebhookEndpoint>>('GET', '/webhooks', { signal });
  }

  listWebhookDeliveries(params: ListWebhookDeliveriesParams = {}, signal?: AbortSignal): Promise<ListResponse<WebhookDelivery>> {
    return this.request<ListResponse<WebhookDelivery>>('GET', '/webhooks/deliveries', {
      query: {
        endpoint_id: params.endpointId,
        limit: params.limit
      },
      signal
    });
  }

  createWebhook(input: CreateWebhookRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<WebhookEndpointWithSecret> {
    return this.request<WebhookEndpointWithSecret>('POST', '/webhooks', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  updateWebhook(endpointId: string, input: UpdateWebhookRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>('PATCH', `/webhooks/${encodeURIComponent(endpointId)}`, {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  replayWebhookDelivery(deliveryId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<WebhookDelivery> {
    return this.request<WebhookDelivery>('POST', `/webhooks/deliveries/${encodeURIComponent(deliveryId)}/replay`, {
      body: {},
      signal: options.signal,
      headers: options.headers
    });
  }

  async deleteWebhook(endpointId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<void> {
    await this.request<void>('DELETE', `/webhooks/${encodeURIComponent(endpointId)}`, {
      signal: options.signal,
      headers: options.headers
    });
  }
}
