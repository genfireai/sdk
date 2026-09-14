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
  | 'reels:read'
  | 'reels:write'
  | 'social:read'
  | 'social:write'
  | 'adsmanage:read'
  | 'adsmanage:write'
  | 'uploads:write'
  | 'influencers:read'
  | 'influencers:write'
  | 'elements:read'
  | 'elements:write'
  | 'brands:read'
  | 'brands:write'
  | 'moodboards:read'
  | 'projects:read'
  | 'projects:write'
  | 'marketing:read'
  | 'teams:read'
  | 'tasks:read'
  | 'tasks:write';

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
  /** Max rows to RETURN (1-100). Does not bound how far back `q` searches. */
  limit?: number;
  /**
   * Keyword search over the account's ENTIRE run history — matched server-side
   * against each run's prompt, topic, title, model and capability. All words
   * must match. This is how to find old work; `limit` never widens it.
   */
  q?: string;
  /** Continue from a previous page: pass its `next_cursor`, same filters. */
  starting_after?: string;
  /** ISO date (or ms epoch) lower bound on createdAt. */
  created_after?: string;
  /** ISO date (or ms epoch) upper bound on createdAt. */
  created_before?: string;
  /** Cap on how many records a keyword search may read (default 5000). */
  max_scan?: number;
  /** Only runs billed to this workspace pool — "what has the team made". */
  team_id?: string;
  /** Only runs filed into this project — "what is in this folder". */
  project_id?: string;
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
      : `Genfire API request failed with status ${fallbackStatus}`;
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
  /**
   * The flags below are served by `GET /v1/models` but postdate the six above,
   * so they are optional: a `Model` read from an older deployment will not
   * carry them, and `capabilities.x === true` is the only safe test.
   */
  /** Image-to-video accepts an `end_image_url` the clip lands on. */
  end_frame?: boolean;
  /** Accepts `reference_video_urls` / `reference_audio_urls`. */
  reference_media?: boolean;
  /** Accepts `camera_path` / `camera_trajectory`. */
  camera_trajectory?: boolean;
  /** The edit endpoint repaints only the white region of a `mask_url`. */
  masked_inpaint?: boolean;
  /** Accepts `keyframes` (images pinned to positions on the timeline). */
  keyframes?: boolean;
  /** Accepts `source_video_url` together with `reference_image_urls`. */
  video_to_video_reference?: boolean;
  /** Accepts `draft_cache_url` to re-render a draft at full quality. */
  draft_enhance?: boolean;
  /**
   * GENFIRE GEDI: the reference endpoint accepts `task` — motion transfer
   * (`reference`), video edit (`editing`) or continuation (`extension`).
   * Filter a model picker on this rather than hard-coding the alias.
   */
  video_task?: boolean;
  /** The schema declares `bitrate_mode` (`standard` | `high`). */
  bitrate_mode?: boolean;
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

export interface EstimateCostRequest {
  /** Model alias from listModels(), e.g. 'video.seedance_2_0'. Required. */
  model: string;
  // Video
  resolution?: string;
  duration?: number;
  generate_audio?: boolean;
  count?: number;
  image_url?: string;
  source_video_url?: string;
  reference_image_urls?: string[];
  first_frame_url?: string;
  last_frame_url?: string;
  // Image
  quality?: string;
  // 3D
  should_texture?: boolean;
  enable_pbr?: boolean;
  enable_rigging?: boolean;
  // Speech
  text?: string;
  character_count?: number;
  voice_id?: string;
  // Music / SFX
  duration_seconds?: number;
  music_length_ms?: number;
  include_details?: boolean;
  with_timestamps?: boolean;
  // Lipsync
  audio_url?: string;
  audio_base64?: string;
}

export interface CostEstimate extends PriceQuote {
  object: 'cost_estimate';
  model: string;
  capability: string;
  /** Exact total credits that will be charged for this configuration. */
  credits: number;
  unit: string;
  breakdown: Record<string, unknown>;
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

/** Live pipeline progress, present on GET /v1/runs/:id while a faceless-reel
 *  run is processing (derived from the reel's stage checkpoints). */
export interface RunProgress {
  /** 0–100 share of the pipeline completed. */
  percent: number;
  /** Short label of the stage currently running, e.g. "Generating visuals 3/8". */
  label: string;
  /** 0-based index of the current stage. */
  step_index: number;
  /** Total number of stages. */
  step_count: number;
  stages: Array<{ key: string; label: string; status: 'done' | 'active' | 'pending' }>;
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
  progress?: RunProgress;
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
  /** Stable position in the submitted array. Never renumbered by a retry. */
  index: number;
  /** The label you submitted, echoed back. Null when you sent none. */
  custom_id: string | null;
  /** How many times this item has been run. 0 on the first attempt. */
  attempt: number;
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
  /** More rows exist below `next_cursor` (run listings). */
  has_more?: boolean;
  /** Pass as `starting_after` to continue exactly where this page stopped. */
  next_cursor?: string | null;
  /** Run search: everything newer than this instant was examined. Null means
   *  the search reached the account's first generation. */
  scanned_through?: string | null;
  /** Run search: the keyword was matched server-side, across full history. */
  search_applied?: boolean;
}

export interface InfluencerMention {
  handle: string;
  influencer_id: string;
}

export interface CreateImageGenerationRequest extends TeamBillable, ProjectFileable, Quotable {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  count?: number;
  /** Single source image to edit. Use `image_urls` for multi-image edits. */
  image_url?: string;
  /**
   * Up to 14 source image URLs for a multi-image edit. Supported by
   * image.gpt_image_2, Seedream, Qwen Image 2 and the Nano Banana family;
   * Grok uses at most the first 3. Routes through the model's edit variant.
   */
  image_urls?: string[];
  /**
   * Quality tier. `image.gpt_image_2` accepts low | medium | high | auto and
   * prices them as a multiplier (low 1x, medium 6x, high 22x).
   * `image.grok_imagine_2` accepts low | medium ONLY, priced as two separate
   * base rates. Unset generates (and bills) medium on both.
   */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /**
   * Output resolution. `image.grok_imagine_pro` and `image.grok_imagine_2`
   * accept 1K | 2K on BOTH text-to-image and edit (4K is rejected). The Nano
   * Banana family (image.nano_banana, image.nano_banana_2,
   * image.nano_banana_pro) accepts it on the EDIT path only — the request must
   * include image_url or mentions.
   */
  resolution?: '1K' | '2K' | '4K';
  /**
   * Optional `[{ handle, influencer_id }]`. When supplied, the model auto-switches
   * to its edit variant and the influencer's reference photos are injected as
   * conditioning. Currently a single mention per request is supported.
   */
  mentions?: InfluencerMention[];
  /**
   * Optional brand id (`GET /v1/brands`). Grounds the generation server-side:
   * the brand's product images are attached as references and its
   * colors/style/voice are prepended to the prompt. Composes with
   * `moodboard_id` — brand identity leads, moodboard aesthetic follows.
   */
  brand_id?: string;
  /**
   * Optional moodboard id (`GET /v1/moodboards`, or a board shared with you).
   * Styles the generation server-side: the board's composed style fragment is
   * prepended to the prompt and its exemplar images attached as edit sources.
   * Requires the `moodboards:read` scope in addition to `images:write`.
   */
  moodboard_id?: string;
  /**
   * How hard the moodboard steers (only meaningful with `moodboard_id`):
   * `subtle` = style text only, `balanced` (default) = text + up to 3
   * exemplar refs, `strong` = text + as many exemplars as fit under the
   * 14-image cap.
   */
  moodboard_strength?: 'subtle' | 'balanced' | 'strong';
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

/**
 * Appearance spec for creating an influencer FROM SCRATCH (no photos).
 * `gender`, `heritage` and `age` form the identity block that anchors the
 * generated person; `prompt` is optional free-text detail.
 */
export interface InfluencerAppearance {
  /** e.g. "woman", "man". */
  gender: string;
  /** Race/ethnicity, e.g. "korean", "black", "latina". */
  heritage: string;
  /** Age range. */
  age: '18-21' | '21-25' | '25-30' | '30-40' | '40+';
  /** Optional free-text descriptor, e.g. "freckles, platinum bob, green eyes, editorial look". */
  prompt?: string;
}

export interface CreateInfluencerOptions {
  /**
   * Short @-mention handle (letters, digits, underscores), e.g. `maya`.
   * Lowercased; unique per account. This is the influencer's only name — the
   * `display_name` in responses is derived from it ("sarah_j" → "Sarah J").
   */
  handle: string;
  /**
   * FROM-PHOTOS mode. 1–8 absolute https URLs of reference photos (clone a real
   * person). At least one should show a clear, front-facing face. Provide this
   * OR `appearance`, not both.
   */
  photoUrls?: string[];
  /**
   * FROM-SCRATCH mode. Generate a brand-new person from described traits (no
   * photos). Provide this OR `photoUrls`, not both.
   */
  appearance?: InfluencerAppearance;
  /** Idempotency key. Reusing it collapses retries into one creation (and one credit charge). */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/**
 * A reusable named image element (a prop — product, logo, object) referenced in
 * a video prompt by `@handle`. Unlike an influencer it's a single flat image;
 * creation is synchronous and free (no generation).
 */
export interface Element {
  id: string;
  object: 'element';
  handle: string;
  name: string;
  image_url: string;
  thumbnail_url: string | null;
  source_type: string;
  aspect_ratio: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  hex: string;
  role: 'primary' | 'secondary' | 'background' | 'text' | 'accent' | 'cta';
}

export interface BrandFont {
  name: string;
  role: 'heading' | 'body';
  source: 'google-fonts' | 'custom';
  google_fonts_url: string | null;
}

export interface BrandVoice {
  tone_adjectives: string[];
  formality: number;
  target_audience: string;
  value_props: string[];
  taglines: string[];
  words_to_use: string[];
  words_to_avoid: string[];
  summary: string;
}

export interface BrandProduct {
  id: string;
  object: 'brand_product';
  name: string;
  description: string | null;
  images: string[];
  price: string | null;
  /** ISO currency code when found (USD/EUR/…). */
  currency: string | null;
  source_url: string | null;
  /** Key selling points extracted from the page copy. */
  usps: string[];
  /** Product category / collection (e.g. "Skincare", "Serums"). */
  category: string | null;
  /** Manufacturer/brand name as scraped (may differ from the brand entity). */
  brand_name: string | null;
  /** SKU / product code. */
  sku: string | null;
  /** Availability, e.g. "InStock", "OutOfStock". */
  availability: string | null;
  /** Structured specs (dimensions, materials, ingredients, weight…). */
  attributes: Array<{ name: string; value: string }>;
  /** Purchasable variants (sizes/colors). */
  variants: Array<{ name: string; price?: string | null; sku?: string | null; available?: boolean | null; image_url?: string | null }>;
  /** Aggregate rating 0-5 when present. */
  rating: number | null;
  /** Number of reviews when present. */
  review_count: number | null;
}

export interface Brand {
  id: string;
  object: 'brand';
  name: string;
  tagline: string | null;
  description: string | null;
  website_url: string;
  logo_url: string | null;
  icon_url: string | null;
  colors: BrandColor[];
  fonts: BrandFont[];
  voice: BrandVoice | null;
  style: string | null;
  default_language: string | null;
  default_country: string | null;
  screenshots: Array<{ kind: 'desktop' | 'desktop_full' | 'mobile'; url: string }>;
  image_urls: string[];
  status: 'ingesting' | 'ready' | 'failed';
  products?: BrandProduct[];
  created_at: string;
  updated_at: string;
}

export interface CreateElementOptions {
  /** Human-friendly name, e.g. `Red Bottle`. Also the in-prompt phrase ("the Red Bottle") when the @handle resolves. */
  name: string;
  /** Absolute https URL of the element image. Upload local files with `uploadFile()` first and pass the `asset_url`. */
  imageUrl: string;
  /** Short @-mention handle (letters, digits, underscores), e.g. `redbottle`. Lowercased; auto-derived from `name` if omitted; unique per account. */
  handle?: string;
  /** Optional aspect ratio of the image, e.g. `1:1`, `9:16`. Informational only. */
  aspectRatio?: string;
  signal?: AbortSignal;
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

export interface CreateGameGenerationRequest {
  /** What game to build — or, with `game_id`, the change to make. */
  prompt: string;
  /** Iterate on an existing game: its `game_id` from a prior generation. Re-generates in place at the same `play_url`. */
  game_id?: string;
  /** Codegen model alias (e.g. `claude-opus-5`). Defaults to Opus. */
  model?: string;
  /** Up to 16 asset URLs (images / GLB / audio) to wire into the game. */
  asset_urls?: string[];
  /** Build with realtime multiplayer via the Genfire relay. */
  multiplayer?: boolean;
}

export interface PublishGameResponse {
  id: string;
  object: 'game';
  is_public: boolean;
}

export interface CreateVideoGenerationRequest extends TeamBillable, ProjectFileable, Quotable {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  duration?: number;
  /** Output resolution (e.g. '480p', '720p', '1080p', '4k'). Supported values and pricing are per-model — see `resolutions` in the model's `limits` from `listModels()`. Higher resolutions cost more credits. */
  resolution?: string;
  image_url?: string;
  /**
   * Last frame the clip lands on, paired with `image_url` for image-to-video:
   * the video interpolates from the start image to this one. Supported by every
   * model whose `capabilities.endFrame` is true in `listModels()` — the Seedance
   * (2.0 all tiers, 2.5), Kling V3/O3/2.6, and Hailuo 03 / Hailuo 02 Standard
   * families. Sending it to another model, or without `image_url`, is a 400.
   */
  end_image_url?: string;
  /** Up to 9 reference images for reference-to-video mode, cited in the prompt as `Image 1`, `Image 2`, … */
  reference_image_urls?: string[];
  /**
   * Hailuo 03 only (`video.hailuo_03`). Up to 3 reference clips, 2–15s each,
   * cited in the prompt as `Video 1`, `Video 2`, `Video 3`.
   */
  reference_video_urls?: string[];
  /**
   * Optional per-clip time windows for `reference_video_urls` — "use seconds
   * 3–8 of the second clip" → `[{ index: 1, start: 3, end: 8 }]`. `index` is
   * 0-based into `reference_video_urls` (or name the clip by `url`); seconds.
   * Only the window is sent (cut server-side, audio kept). Must fit the model's
   * per-clip cap (3s Omni Flash 1.1, 15s Hailuo 03 / Wan 3.0 — 15s total across
   * the Wan pool — 30s Seedance) or the request is a 400
   * `invalid_reference_video_trims`.
   */
  reference_video_trims?: Array<{ index?: number; url?: string; start: number; end: number }>;
  /**
   * Hailuo 03 only (`video.hailuo_03`). Up to 3 reference audio clips, 2–15s
   * each, cited in the prompt as `Audio 1`, `Audio 2`, `Audio 3`. This is how an
   * on-camera character gets a consistent voice — e.g. "the woman in Image 1
   * speaks with the voice in Audio 1". Cannot be the only reference: pair it
   * with at least one reference image or video.
   */
  reference_audio_urls?: string[];
  generate_audio?: boolean;
  /**
   * Output ENCODE quality: 'standard' or 'high'. 'high' requests a larger,
   * higher-quality file at no extra credit cost. Declared by
   * `video.seedance_2_0`, `video.seedance_2_0_fast` and `video.seedance_2_5`;
   * `video.seedance_2_0_mini` and every non-Seedance model have no such field
   * and return 400 `unsupported_bitrate_mode` rather than dropping it from a
   * run you paid for. Filter on `capabilities.bitrate_mode` in `listModels()`.
   */
  bitrate_mode?: 'standard' | 'high';
  /**
   * GENFIRE GEDI — motion transfer and video edit. `video.seedance_2_5` only
   * (`capabilities.video_task` in `listModels()`); any other model is a 400
   * `unsupported_task`.
   *
   * - `'reference'` — MOTION TRANSFER. The clip in `reference_video_urls`
   *   supplies the motion; the stills in `reference_image_urls` supply who or
   *   what performs it. `aspect_ratio` and `duration` are yours.
   * - `'editing'` — VIDEO EDIT. The clip itself is re-lit / swapped / cleaned
   *   up, with any replacement subject in `reference_image_urls`. The output
   *   follows the SOURCE, so the model coerces both `aspect_ratio` and
   *   `duration` to auto — do not send them.
   * - `'extension'` — continue the clip past its last frame. `aspect_ratio` is
   *   coerced to auto; `duration` is yours.
   *
   * `'editing'` and `'extension'` need at least one `reference_video_urls`
   * entry (400 `task_requires_reference_video` otherwise). Cite every reference
   * in the prompt — `@Video1` is the first clip, `@Image1` the first still.
   * Pre-written prompts for both modes: {@link GenFireClient.listGediPresets}.
   */
  task?: 'reference' | 'editing' | 'extension';
}

export interface CreateLipsyncGenerationRequest extends TeamBillable, ProjectFileable, Quotable {
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

export interface DialogueLine {
  text: string;
  /** A stock ElevenLabs voice id (cloned `fal_cloned_*` voices are not supported in dialogue). */
  voice_id: string;
}

export interface CreateSpeechRequest extends TeamBillable, ProjectFileable, Quotable {
  /** The line to speak. Required unless `dialogue` is provided. */
  text?: string;
  /**
   * Voice id. Required for ElevenLabs models (stock voice id or a cloned
   * `fal_cloned_<id>`). For `speech.seed_audio_1_0` it is OPTIONAL and takes a
   * Seed preset name (e.g. `vivi_mixed_en_zh_ja_es_id`) instead.
   */
  voice_id?: string;
  /**
   * Text to Dialogue (`speech.elevenlabs_dialogue_v3`, implied when present):
   * ordered multi-speaker lines rendered as ONE file with matched prosody.
   * ≤10 distinct voices, ≤2000 characters total; v3 audio tags allowed.
   * Replaces `text` + `voice_id`.
   */
  dialogue?: DialogueLine[];
  /** Defaults to `speech.elevenlabs_flash_v2_5` (Turbo v2.5 is deprecated upstream). */
  model?: string;
  voice_name?: string;
  /** ElevenLabs only — ISO 639-1 code enforced on Flash/Turbo/v3 (ignored by Multilingual v2 and cloned voices). */
  language_code?: string;
  /** ElevenLabs only — best-effort reproducibility (0..4294967295). */
  seed?: number;
  /** ElevenLabs only — text spoken immediately BEFORE this chunk (request stitching). */
  previous_text?: string;
  /** ElevenLabs only — text spoken immediately AFTER this chunk (request stitching). */
  next_text?: string;
  /** ElevenLabs only — `auto` (default) | `on` | `off`. */
  apply_text_normalization?: 'auto' | 'on' | 'off';
  /** ElevenLabs only — voice_settings overrides ({ stability, similarity_boost, style, use_speaker_boost, speed }). */
  voice_settings?: { stability?: number; similarity_boost?: number; style?: number; use_speaker_boost?: boolean; speed?: number };
  /** Dialogue only — 0 | 0.5 | 1. */
  stability?: number;
  /** ElevenLabs only — return per-word `words` (and `voice_segments` for dialogue) in the run output. */
  with_timestamps?: boolean;
  /** For `speech.seed_audio_1_0`: one of `wav`, `mp3`, `pcm`, `ogg_opus`. */
  output_format?: string;
  /** Up to 3 reference audio URLs, referenced in `text` as @Audio1–@Audio3. Seed Audio 1.0 only; not with image_url. */
  audio_urls?: string[];
  /** Single reference image URL. Seed Audio 1.0 only; not with audio_urls. */
  image_url?: string;
  /** Output sample rate in Hz (8000/16000/24000/32000/44100/48000). Seed Audio 1.0 only. */
  sample_rate?: number;
  /** Speaking rate. ElevenLabs 0.7–1.2 (clamped); Seed Audio 1.0 0.5–2. */
  speed?: number;
  /** Volume 0.5–2. Seed Audio 1.0 only. */
  volume?: number;
  /** Pitch shift in semitones, -12..12. Seed Audio 1.0 only. */
  pitch?: number;
}

export interface CreateMusicRequest extends TeamBillable, ProjectFileable, Quotable {
  /** Text prompt. Required unless composition_plan or video_url is provided; prompt and composition_plan cannot be combined. */
  prompt?: string;
  /**
   * Video-to-music (ElevenLabs only): score this footage instead of composing
   * from a prompt. Output length = video length (≤600s, ≤200MB); `prompt`
   * becomes an optional description and `tags` steer style. Billed per second
   * of video. Not with composition_plan.
   */
  video_url?: string;
  /** Video-to-music only — up to 10 style tags. */
  tags?: string[];
  /**
   * ElevenLabs only — keep the song server-side for inpainting. With
   * include_details the run output carries `song_id`; reference it from a later
   * music_v2 composition_plan as `{ song_id, range: { start_ms, end_ms } }`
   * chunks to keep those bars and regenerate only the others.
   */
  store_for_inpainting?: boolean;
  /**
   * Structured composition plan instead of a prompt (ElevenLabs models only).
   * music_v1 shape: { positive_global_styles[], negative_global_styles[], sections[] }
   * (per-section styles, duration_ms 3000–120000, lyric lines).
   * music_v2 shape: { chunks[] } (per-chunk text with [Section]/{direction} markup,
   * duration_ms, positive_styles[]). A chunks plan implies music.elevenlabs_music_v2.
   * Duration and billing derive from the plan's summed durations.
   */
  composition_plan?: Record<string, unknown>;
  model?: string;
  /**
   * Desired length in seconds. ElevenLabs prompt mode: 3–600 (default 30).
   * MiniMax Music 3: an upper BOUND of 1–300 (default 60) that billing is
   * charged on — the track may come in shorter. Lyria 3 Pro ignores it.
   */
  duration_seconds?: number;
  include_details?: boolean;
  with_timestamps?: boolean;
  /** Guarantee instrumental output. ElevenLabs prompt mode only. */
  force_instrumental?: boolean;
  /** With a music_v1 composition_plan: enforce section durations exactly. */
  respect_sections_durations?: boolean;
  /**
   * Random seed for reproducible results — ElevenLabs composition_plan mode,
   * or MiniMax Music 3 (which returns the seed it used in the run output).
   */
  seed?: number;
  output_format?: string;
  /** Image URL used as inspiration for the generated music. Lyria 3 Pro only. */
  image_url?: string;
  /** Description of what to exclude from the generated audio. Lyria 3 Pro only. */
  negative_prompt?: string;
  /**
   * The lyrics to sing. REQUIRED for music.minimax_music_3 — that model writes
   * none of its own. Structure tags ([intro], [verse], [pre-chorus], [chorus],
   * [post-chorus], [bridge], [instrumental], [solo], [outro]) must each be on
   * their own line; Genfire re-splits a tag sharing a line with lyric text so
   * nothing is silently dropped. Ignored by ElevenLabs and Lyria 3 Pro.
   */
  lyrics?: string;
  /** Flow-matching Euler steps per 8s chunk, 1–100 (default 30). MiniMax Music 3 only. */
  num_inference_steps?: number;
  /** Classifier-free guidance scale, 0–20 (default 1.7). MiniMax Music 3 only. */
  guidance_scale?: number;
}

/** Background-music config for a faceless reel. */
export interface FacelessReelMusic {
  source: 'none' | 'preset' | 'ai' | 'library';
  /** Curated track id (source 'preset') — see {@link GenFireClient.listFacelessReelMusicPresets}. */
  preset_id?: string;
  /** Prompt for an AI-generated track (source 'ai'). */
  prompt?: string;
  /** A track id from your library (source 'library'). */
  track_id?: string;
}

/** Camera-motion feel for a reel's image slideshow.
 *  - `auto`: per-niche default (unchanged behavior)
 *  - `calm`: slow pans + subtle zoom
 *  - `dynamic`: mixed pans + zooms
 *  - `energetic`: corner punch-ins + handheld shake */
export type MotionVibe = 'auto' | 'calm' | 'dynamic' | 'energetic';

/** i2v model used for an "animated hook" (a real video clip on the first scene).
 *  - `grok`: Grok Imagine v1.5 (recommended)
 *  - `seedance-mini`: Seedance 2.0 mini (cheaper) */
export type ReelVideoModel = 'grok' | 'seedance-mini';

export interface CreateFacelessReelRequest extends TeamBillable, Quotable {
  /** Subject/seed for the reel. Use a phrase or "Surprise me with a fresh idea". */
  topic: string;
  /** Niche preset id — see {@link GenFireClient.listFacelessReelPresets}. */
  preset_id?: string;
  /** Visual style id — see {@link GenFireClient.listFacelessReelStyles}. Defaults to the preset's recommended style. */
  style_id?: string;
  /** Target length in seconds (10–600, up to 10 minutes). Drives script + scene count. */
  target_duration_sec?: number;
  /** Caption font/animation preset id — see {@link GenFireClient.listFacelessReelCaptionPresets}. */
  caption_preset_id?: string;
  /** Override the caption animation: highlight | pop | typewriter | classic | background. */
  caption_animation?: string;
  /** TTS voice id (ElevenLabs or FAL/Qwen). */
  voice_id?: string;
  /** Camera-motion feel for the slideshow. Defaults to 'auto' (per-niche). */
  motion_vibe?: MotionVibe;
  /** Premium: animate the FIRST scene with a real i2v video clip (rest stay
   *  still-image Ken-Burns). Adds the i2v clip cost. Default false. */
  animated_hook?: boolean;
  /** i2v model the animated hook uses. Default 'grok'. */
  video_model?: ReelVideoModel;
  /** Extra creative direction for the script model. */
  direction?: string;
  /** Author a fully custom story instead of a niche preset. */
  custom_story?: { prompt: string; scene_hint?: string };
  music?: FacelessReelMusic;
}

export interface EstimateFacelessReelCostRequest {
  preset_id?: string;
  target_duration_sec?: number;
  music?: Pick<FacelessReelMusic, 'source'>;
  animated_hook?: boolean;
  video_model?: ReelVideoModel;
}

export interface FacelessReelCostEstimate {
  object: 'reel_cost_estimate';
  images: number;
  voiceover: number;
  music: number;
  /** i2v clips (animated hook = 1 clip). 0 when no animation requested. */
  videoClips: number;
  total: number;
  sceneCount: number;
}

/** 'shorts' = 9:16 reels; 'longform' = 16:9 explainer episodes. Picks the engine. */
export type FacelessChannelFormat = 'shorts' | 'longform';

/** Defaults every new episode of a channel inherits. */
export interface FacelessChannelEpisodeDefaults {
  aspect_ratio?: '16:9' | '9:16';
  target_duration_sec?: number;
  /** 'seamless' = each clip flows from the previous; 'scenes' = hard cuts; 'stills' = no animation. */
  motion_style?: 'seamless' | 'scenes' | 'stills';
}

/**
 * A faceless CHANNEL — a named recurring series that auto-produces episodes.
 * This is the same object the Faceless Studio shows; "subscription" in the
 * type and method names is retained for backwards compatibility.
 */
export interface FacelessReelSubscriptionInput {
  /** The channel name. */
  label?: string;
  /** Square channel avatar image URL. */
  avatar_url?: string;
  /** One-line pitch shown under the channel name. */
  tagline?: string;
  /** Longer channel description. */
  description?: string;
  /** Niche id (education, history, kids, storytelling, …). */
  niche?: string;
  format?: FacelessChannelFormat;
  episode_defaults?: FacelessChannelEpisodeDefaults;
  preset_id?: string;
  style_id?: string;
  caption_preset_id?: string;
  voice_id?: string;
  /** Camera-motion feel for the slideshow. Defaults to 'auto' (per-niche). */
  motion_vibe?: MotionVibe;
  /** Premium: animate the first scene with an i2v clip. Default false. */
  animated_hook?: boolean;
  /** i2v model for the animated hook. Default 'grok'. */
  video_model?: ReelVideoModel;
  target_duration_sec?: number;
  music?: FacelessReelMusic;
  /** 'ai-auto' for fresh ideas, 'user-list' to rotate `topic_seeds`. */
  topic_source?: 'ai-auto' | 'user-list';
  topic_seeds?: string[];
  /** Reels per day (1–6). */
  cadence_per_day?: number;
  /** Local "HH:mm" times; length must equal `cadence_per_day`. */
  slots?: string[];
  /** IANA timezone, e.g. 'America/New_York'. */
  timezone?: string;
  enabled?: boolean;
}

export interface FacelessReelSubscription {
  id: string;
  object: 'reel_subscription';
  enabled: boolean;
  /** The channel name. */
  label?: string;
  avatarUrl?: string;
  tagline?: string;
  description?: string;
  niche?: string;
  format?: FacelessChannelFormat;
  /** camelCase on the way out — the subscription DTO predates the snake_case convention. */
  episodeDefaults?: { aspectRatio: '16:9' | '9:16'; targetDurationSec: number; animationMode: 'full' | 'stills'; motionStyle?: 'seamless' | 'scenes' | 'stills' };
  presetId: string;
  captionPresetId: string;
  voiceId: string;
  cadencePerDay: number;
  slots: string[];
  timezone: string;
  [key: string]: any;
}

/** A recurring explainer character: an UPPERCASE name plus ONE fixed visual
 *  identity that stays consistent across every scene it appears in. */
export interface ExplainerScriptCastMember {
  /** UPPERCASE name the beats refer to, e.g. "MAYA". */
  name: string;
  /** ONE fixed visual identity (age, look, wardrobe). Kept verbatim across scenes. */
  description: string;
}

/** One agent-authored explainer beat (≈1 scene). */
export interface ExplainerScriptBeat {
  /** Spoken narration, word for word. May include ElevenLabs v3 [audio tags]
   *  like [pause] or [whispers] — performance directions, never spoken. */
  narration: string;
  /** Storyboard shot-spec: the concrete subjects on screen, composition and
   *  camera angle, setting, and quoted on-screen labels. No metaphors. */
  visual: string;
  /** Director's motion note (omni camera vocabulary). */
  motion?: string;
  /** 'anchored' (default) animates the style-locked frame; 'direct' lets the
   *  video model design the visualization (chained/ref beats force anchored). */
  render?: 'anchored' | 'direct';
  /** Beat visually continues the previous shot (last-frame chaining). */
  continues?: boolean;
  /** 1-based indices into the request's `reference_images` this beat features. */
  refs?: number[];
  /** Up to 3 verbatim narration substrings, popped by keyword captions. */
  emphasis?: string[];
  /** Declared cast names featured in this beat. */
  cast?: string[];
}

/** A complete agent-authored explainer script (cast + 3–100 ordered beats).
 *  Passing one bypasses Genfire's internal LLM entirely — you author the whole
 *  creative contract and Genfire is pure rendering. */
export interface ExplainerScript {
  /** Recurring characters (up to 3). */
  cast?: ExplainerScriptCastMember[];
  /** Ordered beats (3–100). Total narration length sets the film's runtime. */
  beats: ExplainerScriptBeat[];
}

export interface CreateExplainerRequest extends TeamBillable, ProjectFileable, Quotable {
  /** What the explainer is about. Required even alongside a script (titling/metadata). */
  topic: string;
  /** Structured agent-authored script. When present, Genfire makes ZERO
   *  internal LLM calls (no script writing, no storyboarding) — it renders
   *  your beats verbatim, and the narration length sets the duration
   *  (`target_duration_sec` is ignored). */
  script?: ExplainerScript;
  /** Plain-text script narrated verbatim; Genfire still storyboards the visuals. */
  custom_script?: string;
  /** Visual style id — see {@link GenFireClient.listExplainerStyles}. */
  style_id?: string;
  /** '16:9' (default) or '9:16'. */
  aspect_ratio?: '16:9' | '9:16';
  /** Target length in seconds (20–600, default 60). Ignored when `script` is present. */
  target_duration_sec?: number;
  /** TTS voice id. */
  voice_id?: string;
  /** How much of the film gets real video clips vs. still frames:
   *  'full' (every scene, default) | 'mixed' | 'stills'. */
  motion_level?: 'full' | 'mixed' | 'stills';
  /** Background music (same shape as faceless reels). */
  music?: FacelessReelMusic;
  /** Captions are opt-in for explainers — pass a caption preset id
   *  (see {@link GenFireClient.listFacelessReelCaptionPresets}) to burn them in. */
  caption_preset_id?: string;
  /** Vertical caption placement. */
  caption_position?: 'top' | 'middle' | 'bottom';
  /** 'full' shows every word; 'keywords' pops only the emphasis words. */
  caption_mode?: 'full' | 'keywords';
  /** Override the caption animation (see the caption presets catalog). */
  caption_animation?: string;
  /** Up to 8 https image URLs (products, characters, brands) that must appear
   *  in the film. Beats reference them by 1-based index via `refs`. */
  reference_images?: Array<{ url: string; label?: string }>;
  /** How animated scenes join: 'seamless' (default — each clip seeds from the
   *  previous clip's last frame, reads as continuous footage) or 'cuts' (every
   *  scene is its own shot, hard cut to hard cut). Stills ignore it. */
  continuity?: 'seamless' | 'cuts';
  /** An authored script (`script` / `custom_script`) that re-tells an episode
   *  this account already rendered is refused with a 409 `duplicate_script`
   *  naming the match. Pass true to render it anyway (a remake or sequel). */
  allow_duplicate?: boolean;
}

export interface EstimateExplainerCostRequest {
  /** Target length in seconds (20–600). Ignored when `script` is present. */
  target_duration_sec?: number;
  aspect_ratio?: '16:9' | '9:16';
  motion_level?: 'full' | 'mixed' | 'stills';
  voice_id?: string;
  music?: Pick<FacelessReelMusic, 'source'>;
  /** With a structured script, duration derives from the narration — the
   *  quote matches what {@link GenFireClient.createExplainer} would charge. */
  script?: ExplainerScript;
}

export interface ExplainerCostEstimate {
  object: 'explainer_cost_estimate';
  /** Duration the quote is based on (derived from `script` narration when present). */
  effective_duration_sec: number;
  images: number;
  voiceover: number;
  music: number;
  /** Per-scene i2v video clips — `motion_level` drives how many scenes animate. */
  videoClips: number;
  total: number;
  sceneCount: number;
  /** How many of the scenes get real video clips. */
  animatedScenes: number;
}

/** An explainer visual style preset, accepted as `style_id`. */
export interface ExplainerStyle {
  id: string;
  label: string;
}

/** One section of a song (verse/chorus/bridge…), used to pace the video. */
export interface MusicVideoSongSection {
  label: string;
  start_sec: number;
  end_sec: number;
}

/** One word timing, for karaoke-style lyric captions. */
export interface MusicVideoWordTimestamp {
  word: string;
  start_sec: number;
  end_sec: number;
}

/** Inline song generation: Genfire produces the track (ElevenLabs music_v2)
 *  before rendering the video. Billed as its own step. */
export interface MusicVideoInlineSong {
  /** What the track should sound like (genre, mood, instrumentation, vocals). */
  prompt: string;
  /** Track length in milliseconds (10000–600000). */
  duration_ms: number;
  /** Generate an instrumental (no vocals). */
  instrumental?: boolean;
}

export interface CreateMusicVideoRequest extends TeamBillable, ProjectFileable, Quotable {
  /** Creative concept / narrative direction for the video. Steers the shot-list
   *  and styling. Required. */
  concept: string;
  /** https URL of a bring-your-own song. Provide THIS or an inline `song`. */
  song_url?: string;
  /** Inline song generation (instead of `song_url`) — Genfire generates and
   *  bills the track first, then renders the video. */
  song?: MusicVideoInlineSong;
  /** Title for a bring-your-own `song_url` track. */
  song_title?: string;
  /** Full lyrics for a bring-your-own track (improves lyric-aware pacing/captions). */
  song_lyrics?: string;
  /** Pre-computed sections for a bring-your-own track (skips analysis). */
  song_sections?: MusicVideoSongSection[];
  /** Word timings for karaoke captions on a bring-your-own track. */
  song_word_timestamps?: MusicVideoWordTimestamp[];
  /** Only for a bring-your-own `song_url` track: transcribe it to derive lyrics
   *  + word timestamps (required for `lyric_captions` on uploaded songs). Runs
   *  as its own step, billed per second. No-op when `song_word_timestamps` were
   *  supplied or an inline `song` is used; skip for instrumentals. Default false. */
  transcribe_lyrics?: boolean;
  /** Visual style id — see {@link GenFireClient.listMusicVideoStyles}. Required. */
  style_preset_id: string;
  /** '9:16' (default) or '16:9'. */
  aspect_ratio?: '9:16' | '16:9';
  /** Scenes per second of song: 'low' (~10s/scene) | 'medium' (~7s, default) |
   *  'high' (~5s). More scenes = more clips = higher cost. */
  scene_density?: 'low' | 'medium' | 'high';
  /** Burn karaoke-style lyric captions. Default false. */
  lyric_captions?: boolean;
  /** Up to 8 https image URLs (characters/products/looks) that should appear. */
  reference_images?: Array<{ url: string; label?: string }>;
  /** Bind a trained influencer's identity so the SAME character appears across
   *  scenes. Pass the `id` from {@link GenFireClient.listInfluencers}. Its
   *  conditioning photos are baked into the style anchor and re-anchored on each
   *  character scene (identity comes from the photos, never appearance text).
   *  Combinable with `reference_images`. */
  influencer_id?: string;
}

export interface EstimateMusicVideoCostRequest {
  /** Length of the song in seconds (the dominant cost driver). Required. */
  song_duration_sec: number;
  /** '9:16' (default) or '16:9'. */
  aspect_ratio?: '9:16' | '16:9';
  /** 'low' | 'medium' (default) | 'high'. */
  scene_density?: 'low' | 'medium' | 'high';
  /** Whether karaoke lyric captions are burned in. */
  lyric_captions?: boolean;
}

export interface MusicVideoCostEstimate {
  object: 'music_video_cost_estimate';
  /** Total credits for the video-production stage (song cost NOT included). */
  totalCredits: number;
  /** Number of scenes the song is cut into. */
  sceneCount: number;
  /** Per-line cost breakdown (anchor frame + AI clips). */
  breakdown: Array<{ label: string; credits: number }>;
}

/** A music-video visual style preset, accepted as `style_preset_id`. */
// ── Genfire Gedi (motion transfer & video edit) ───────────────────────────────
//
// Both halves are ONE `createVideoGeneration` call on `video.seedance_2_5` with
// a different `task`. These two catalogs are the recipe book: prompts already
// written in the `@Video1` / `@Image1` citation idiom the model binds on.

export type GediEditGroup = 'relight' | 'swap' | 'reframe' | 'cleanup' | 'restyle' | 'draw';

export interface GediEditGroupInfo {
  id: GediEditGroup;
  label: string;
  blurb: string;
}

export interface GediEditPreset {
  id: string;
  object: 'gedi_edit_preset';
  label: string;
  group: GediEditGroup;
  task: 'editing';
  /** Ready to send as `prompt`. Cites `@Video1`, and `@Image1` when it needs one. */
  prompt: string;
  /** The prompt cites `@Image1` — send at least one `reference_image_urls` entry. */
  requires_image: boolean;
  restyle_preset_id: string | null;
  /** Region-based editing is not shipped yet. Listed, but do not call it. */
  coming_soon: boolean;
}

export interface GediMotionPreset {
  id: string;
  object: 'gedi_motion_preset';
  label: string;
  task: 'reference';
  prompt: string;
  /** How many `reference_image_urls` entries the prompt cites (@Image1…). */
  images: number;
}

export interface GediPresets {
  object: 'gedi_presets';
  /** The only model these recipes run on. */
  model: string;
  edit_groups: GediEditGroupInfo[];
  edit_presets: GediEditPreset[];
  motion_presets: GediMotionPreset[];
}

export interface GediMotion {
  id: string;
  object: 'gedi_motion';
  title: string;
  /** Pass as the single `reference_video_urls` entry of a `task: 'reference'` run. */
  media_url: string;
  thumbnail_url: string | null;
  /** Seconds, where known. Counts against the 30.2s combined pool budget. */
  duration: number | null;
  aspect_ratio: string | null;
  tags: string[];
  prompt: string | null;
}

export interface MusicVideoStyle {
  id: string;
  name: string;
  description: string;
}

// ── Picture books (Picture Book Studio) ───────────────────────────────────────

export type PictureBookAgeBand = 'board' | 'picture' | 'early-reader';
export type PictureBookQuality = 'low' | 'medium';
export type PictureBookLettering = 'typeset' | 'lettered';
export type PictureBookStatus = 'draft' | 'generating' | 'ready' | 'failed';
export type PictureBookExportKind = 'interior-pdf' | 'cover-pdf' | 'ebook-pdf' | 'images-zip';

/** A recurring character: UPPERCASE name + ONE fixed physical description. */
export interface PictureBookCastInput {
  name: string;
  /** Physical appearance only (≤240 chars) — no style words, no personality. */
  description: string;
}

/**
 * A recurring SETTING (the places bible): UPPERCASE name + ONE fixed physical
 * description — architecture, landmarks, colours, layout. Recurring settings
 * only (the burrow, the hill); a one-off location stays in the page's visual.
 */
export interface PictureBookPlaceInput {
  name: string;
  /** Physical look only (≤240 chars): architecture, landmarks, colours, layout — no style words. */
  description: string;
}

/** One interior page of an authored plan. */
export interface PictureBookPlanPageInput {
  /**
   * page (art + words, default) | text-page (words only, no art) | spread
   * (ONE picture across two facing pages — a panorama or the big moment;
   * at most 1/3 of the pages, never page 1, and it must START on an even page
   * (2–3, 4–5 …) or the server demotes it to a single page; the words sit on
   * one half; one render, one page credit).
   */
  kind?: 'page' | 'text-page' | 'spread';
  /** The exact words on the page. */
  text: string;
  /** The scene for the art — refer to characters by NAME, never re-describe them. */
  visual: string;
  /** Cast NAMES physically in this picture. */
  cast?: string[];
  /** The place NAME this page happens in — name it here, do not re-describe it in the visual. */
  place?: string;
}

/**
 * A caller-authored book plan (PREFERRED over idea/script): Genfire renders
 * exactly these words and runs no planner of its own.
 */
export interface PictureBookPlanInput {
  title: string;
  premise?: string;
  synopsis?: string;
  cast?: PictureBookCastInput[];
  /** The places bible: up to 4 recurring settings, one reference sheet each. */
  places?: PictureBookPlaceInput[];
  /** Interior pages in reading order (4–48); covers are added for you. */
  pages: PictureBookPlanPageInput[];
  cover_visual?: string;
  back_cover_blurb?: string;
  dedication?: string;
}

export interface CreatePictureBookRequest {
  /** PREFERRED: your own complete plan — title, cast bible, every page's text + visual, cover + blurb. */
  plan?: PictureBookPlanInput;
  /** Fallback: one-line story premise; Genfire's planner writes the book from it. Provide plan, idea OR script. */
  idea?: string;
  /** The full story text, one paragraph per page; the planner splits it into pages. */
  script?: string;
  title?: string;
  /** board (0–3) | picture (3–7, default) | early-reader (5–8) — sets the words-per-page budget. */
  age_band?: PictureBookAgeBand;
  /** Interior page count within the age band's options (defaults 12 / 24 / 32). */
  pages?: number;
  /** Illustration style id — see {@link GenFireClient.listPictureBookStyles}. Default "storybook". */
  style_id?: string;
  /** Format id (KDP trims, a4, digital-* aspects). Default "kdp-8.5x8.5". */
  format_id?: string;
  /** GPT Image 2 quality for every unit. Default "low". */
  quality?: PictureBookQuality;
  /** typeset (default, words set in post) | lettered (painted into the art). */
  lettering?: PictureBookLettering;
  /** Up to 4 recurring characters. Omit to let the planner invent the cast. */
  cast?: PictureBookCastInput[];
  /** Bill a workspace credit pool instead of the personal balance. */
  team_id?: string;
}

// ── Coloring books ─────────────────────────────────────────────────────────
// The same documents, runs and exports as picture books, drawn as
// black-and-white line art. A separate request type rather than a flag,
// because the inputs barely overlap.

export type ColoringComplexity = 'toddler' | 'kids' | 'tween' | 'adult';
export type ColoringLineWeight = 'bold' | 'medium' | 'fine';
export type ColoringBorder = 'none' | 'thin' | 'decorative';

export interface ColoringBookPageInput {
  /**
   * ONE concrete sentence naming what is drawn and what it is doing:
   * "A barn owl landing on a fence post, wings spread wide."
   *
   * Never mention colour, shading, ink, outlines or "coloring page" — the
   * medium is fixed and repeating it only confuses the drawing.
   */
  subject: string;
  /** One short clause: where the subject sits in the frame, what fills the rest. */
  composition?: string;
  /** Two or three words naming the page; printed only if `captions` is on. */
  caption?: string;
  /** Cast NAMES in this drawing (recurring-character books only). */
  cast?: string[];
}

export interface ColoringBookPlanInput {
  title: string;
  /** One line describing what every page shows. */
  theme?: string;
  subtitle?: string;
  cast?: PictureBookCastInput[];
  /**
   * The pages, in order (8–120).
   *
   * THE RANGE RULE: no two may share a subject, and scale, angle, energy and
   * setting must vary across the book. A forty-page book of one repeated idea
   * is the default failure mode and it is worthless. Repeats are dropped
   * server-side and reported in the estimate's `warnings`.
   */
  pages: ColoringBookPageInput[];
  /** The most appealing subject in the book, for a FULL-COLOUR cover. */
  cover_visual?: string;
  back_cover_blurb?: string;
}

export interface CreateColoringBookRequest {
  /** PREFERRED: your own page list — drawn exactly as written, no server planner. */
  plan?: ColoringBookPlanInput;
  /** Fallback: one line describing what every page shows. Provide plan OR theme. */
  theme?: string;
  title?: string;
  /** How many drawings (8–120). With `blank_backs` on, the PRINTED interior is twice this. */
  pages?: number;
  /** How much detail is in each drawing — the choice that matters most. Default "kids". */
  complexity?: ColoringComplexity;
  /** Stroke weight. Defaults to what the complexity reads best at. */
  line_weight?: ColoringLineWeight;
  /** A frame drawn around each page. Default "none". */
  border?: ColoringBorder;
  /** A SUBJECT WORLD — see {@link GenFireClient.listColoringBookStyles}. The medium is always black ink on white paper. Default "animals". */
  style_id?: string;
  /** Trim id. Default "kdp-8.5x11" — the coloring-book shelf size. */
  format_id?: string;
  /** GPT Image 2 quality for every page. Default "low". */
  quality?: PictureBookQuality;
  /** Default true on print: a blank page behind every drawing so markers cannot bleed through. DOUBLES the printed page count and thickens the spine. */
  blank_backs?: boolean;
  /** Default false: a coloring page sits inside a white border you colour up to. */
  bleed?: boolean;
  /** Print each page's caption in the margin under the drawing. Default false. */
  captions?: boolean;
  /** Up to 4 recurring characters — character coloring books only. */
  cast?: PictureBookCastInput[];
  /** Bill a workspace credit pool instead of the personal balance. */
  team_id?: string;
}

export interface ColoringBookCostEstimate {
  object: 'coloring_book_cost_estimate';
  estimated_credits: number;
  breakdown: PictureBookCostLine[];
  current_credits: number | null;
  affordable: boolean | null;
  plan: {
    title: string;
    theme: string;
    pages: number;
    /** Every page's subject — read these back before spending; it is the cheapest way to catch a repetitive book. */
    subjects: string[];
    /** Repeats that were dropped, and anything else advisory. */
    warnings?: string[];
  };
  config: {
    pages: number;
    complexity: ColoringComplexity;
    line_weight: ColoringLineWeight;
    border: ColoringBorder;
    style_id: string;
    format_id: string;
    quality: PictureBookQuality;
    blank_backs: boolean;
    bleed: boolean;
  };
  /** What the printer actually binds — blank backs double it. */
  printed_interior_pages: number;
}

export interface ColoringBookCatalog {
  object: 'coloring_book_catalog';
  styles: Array<{
    id: string;
    label: string;
    tagline: string;
    /** What this world draws. A style never names a medium. */
    subject_world: string;
    suggested_complexity: ColoringComplexity;
    palette: string[];
    thumbnail_url: string;
  }>;
  formats: Array<{
    id: string; label: string; kind: 'print' | 'digital'; group: string; aspect: string;
    trim_in: { w: number; h: number } | null; note: string | null; kdp_ready: boolean;
  }>;
  complexities: Array<{
    id: ColoringComplexity; label: string; ages: string; note: string;
    line_weight: ColoringLineWeight; page_options: number[];
  }>;
  line_weights: ColoringLineWeight[];
  borders: ColoringBorder[];
  qualities: PictureBookQuality[];
  export_kinds: PictureBookExportKind[];
  page_range: { min: number; max: number; large_run: number };
  defaults: Record<string, unknown>;
  interior: string;
}

export interface PictureBookCostLine {
  label: string;
  unit_key: string;
  units: number;
  unit_credits: number;
  credits: number;
}

export interface PictureBookCostEstimate {
  object: 'picture_book_cost_estimate';
  estimated_credits: number;
  breakdown: PictureBookCostLine[];
  current_credits: number | null;
  affordable: boolean | null;
  /** What the planner would build — title, page count and cast. */
  plan: {
    title: string;
    premise: string;
    pages: number;
    art_pages: number;
    cast: Array<{ name: string; description: string }>;
    places?: Array<{ name: string; description: string }>;
  };
  config: {
    age_band: PictureBookAgeBand;
    pages: number;
    style_id: string;
    format_id: string;
    quality: PictureBookQuality;
    lettering: PictureBookLettering;
  };
}

export interface PictureBookStyle {
  id: string;
  label: string;
  tagline: string;
  palette: string[];
  font_id: string;
  thumbnail_url: string;
}

export interface PictureBookFormat {
  id: string;
  label: string;
  kind: 'print' | 'digital';
  group: string;
  aspect: string;
  trim_in: { w: number; h: number } | null;
  note: string | null;
}

export interface PictureBookAgeBandSpec {
  id: PictureBookAgeBand;
  label: string;
  ages: string;
  words_per_page: [number, number];
  page_options: number[];
  default_pages: number;
}

export interface PictureBookCatalog {
  object: 'picture_book_catalog';
  styles: PictureBookStyle[];
  formats: PictureBookFormat[];
  age_bands: PictureBookAgeBandSpec[];
  qualities: PictureBookQuality[];
  lettering_modes: PictureBookLettering[];
  export_kinds: PictureBookExportKind[];
  defaults: { age_band: PictureBookAgeBand; style_id: string; format_id: string; quality: PictureBookQuality; lettering: PictureBookLettering };
}

export interface PictureBookPage {
  id: string;
  /** spread = one picture across two facing interior pages (two page slots). */
  kind: 'front-cover' | 'title' | 'page' | 'spread' | 'text-page' | 'back-cover';
  order: number;
  /** Reader-facing interior page number(s): "4" or "4–5" for a spread; null on covers. */
  page_number?: string | null;
  page_numbers?: number[];
  text: string;
  visual: string;
  cast: string[];
  /** The place NAME this page happens in (its sheet rides along), or null. */
  place?: string | null;
  place_id?: string | null;
  layout: 'art-full' | 'art-text-split' | 'text-page';
  has_art: boolean;
  art_url: string | null;
  art_status: 'pending' | 'generating' | 'ready' | 'failed';
  art_error: string | null;
}

export interface PictureBookCastMember {
  id: string;
  name: string;
  description: string;
  has_sheet: boolean;
  sheet_url: string | null;
  sheet_status: 'none' | 'generating' | 'ready' | 'failed';
}

/** A recurring setting with its reference sheet (a wide establishing view). */
export interface PictureBookPlace {
  id: string;
  name: string;
  description: string;
  has_sheet: boolean;
  sheet_url: string | null;
  sheet_status: 'none' | 'generating' | 'ready' | 'failed';
}

export interface PictureBookExport {
  id?: string;
  object?: 'picture_book_export';
  book_id?: string;
  kind: PictureBookExportKind;
  url: string | null;
  bytes?: number | null;
  warnings: string[];
  spec?: Record<string, unknown> | null;
  created_at: string;
}

export interface PictureBook {
  object: 'picture_book';
  id: string;
  title: string;
  author: string | null;
  status: PictureBookStatus;
  age_band: PictureBookAgeBand;
  quality: PictureBookQuality;
  lettering: PictureBookLettering;
  style_id: string | null;
  format_id: string | null;
  aspect: string | null;
  page_count: number;
  ready_pages: number;
  /** Stage progress while status is "generating". */
  progress: RunProgress | null;
  generation: { stage: string; done: number; total: number; error: string | null } | null;
  premise: string | null;
  synopsis: string | null;
  cast: PictureBookCastMember[];
  /** The places bible — recurring settings, one reference sheet each. */
  places?: PictureBookPlace[];
  pages: PictureBookPage[];
  exports: Array<{ id: string; kind: PictureBookExportKind; url: string; warnings: string[]; created_at: string }>;
  credits: { quoted: number; spent: number } | null;
  /** Studio deep link (path on genfire.ai). */
  url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSoundEffectRequest extends TeamBillable, ProjectFileable, Quotable {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  output_format?: string;
  prompt_influence?: number;
  loop?: boolean;
}

export interface CreateTranscriptionRequest extends TeamBillable, ProjectFileable, Quotable {
  /** Direct audio file URL. Provide exactly one of audio_url / video_url / youtube_url. */
  audio_url?: string;
  /** Direct video file URL; audio is extracted before transcription. */
  video_url?: string;
  /** A YouTube URL to download and transcribe (max 2 hours). */
  youtube_url?: string;
  /**
   * Transcription model alias: `transcription.whisper_v1` (default) or
   * `transcription.elevenlabs_scribe_v2` (diarization, keyterms, entities,
   * 90+ languages).
   */
  model?: string;
  /** Scribe only — ISO 639-1/639-3 code; omit to auto-detect. */
  language?: string;
  /** Scribe only — label speakers (default true); every word carries `speaker_id`. */
  diarize?: boolean;
  /** Scribe only — expected speaker count, 1–32. */
  num_speakers?: number;
  /** Scribe only — vocabulary to bias towards (≤1000 terms, <50 chars each). */
  keyterms?: string[];
  /** Scribe only — emit [laughter] / [applause] etc. as audio_event words (default true). */
  tag_audio_events?: boolean;
  /** Scribe only — drop fillers and disfluencies. */
  no_verbatim?: boolean;
  /** Scribe only — all | pii | phi | pci | other | offensive_language. */
  entity_detection?: string | string[];
  /** Scribe only — redact these entity classes in the transcript text. */
  entity_redaction?: string | string[];
  /** Scribe only — label agent/customer style roles where detectable. */
  detect_speaker_roles?: boolean;
}

/** Shape of `run.output` for a completed transcription run. */
export interface TranscriptionOutput {
  transcript_id: string | null;
  text: string;
  language: string | null;
  duration: number | null;
  /** Whisper words carry `probability`; Scribe words carry `speaker_id` (when diarized) and `type: 'audio_event'` for tagged sounds. */
  words: Array<{ word: string; start: number; end: number; probability?: number; speaker_id?: string; type?: 'audio_event' }>;
  segments: Array<{ id: number; start: number; end: number; text: string; speaker_id?: string }>;
  audio_url: string | null;
  /** Scribe only, when entity_detection was requested. */
  entities?: unknown[] | null;
}

export interface ExtractProductRequest {
  url: string;
}

export interface BatchRequestItem {
  input: Record<string, unknown>;
  /**
   * Your own label for this item, <= 64 chars and unique within the batch.
   * Echoed back on the item, which is what lets a 50-row result be joined back
   * to the rows you submitted without depending on `index`.
   */
  custom_id?: string;
}

export interface CreateBatchRequest extends TeamBillable {
  mode: BatchMode;
  /**
   * For mode 'operation': `images.generations.create`,
   * `videos.generations.create` or `audio.speech.create`. For mode 'workflow':
   * any key from {@link GenFireClient.listWorkflows}.
   */
  target: string;
  concurrency?: number;
  items: BatchRequestItem[];
}

export interface ListBatchItemsParams {
  /** Fetch one state only — 'failed' is the useful one on a large batch. */
  status?: BatchItemStatus;
  limit?: number;
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

export interface WaitForBatchOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onTick?: (batch: Batch, elapsedMs: number) => void;
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

// ── 3D models (Meshy v7 default, v6 pinnable) ─────────────────────────────────

export type MeshTopology = 'quad' | 'triangle';
export type MeshModelType = 'standard' | 'lowpoly';
export type MeshPoseMode = 'a-pose' | 't-pose' | '';
export type MeshSymmetryMode = 'off' | 'auto' | 'on';

export interface Create3dModelRequest extends TeamBillable, Quotable {
  /** Single source image (https URL). Provide this OR `image_urls`. */
  image_url?: string;
  /** 1–4 images of the SAME object from different angles. When more than one is
   *  given and the model supports it, the multi-image endpoint is used. */
  image_urls?: string[];
  /** model_3d_generation alias from {@link GenFireClient.listModels}. Defaults
   *  to the registry default when omitted. */
  model?: string;
  /** Generate textures. Default true. */
  should_texture?: boolean;
  /** Physically-based rendering maps. Default false. */
  enable_pbr?: boolean;
  /** Produce a rigged skeleton. Default false. */
  enable_rigging?: boolean;
  /** Requires `enable_rigging`. Default false. */
  enable_animation?: boolean;
  /** Animation library action, 0–696. Requires `enable_animation`. */
  animation_action_id?: number;
  /** Real-world height in metres, used to scale a rigged mesh. */
  rigging_height_meters?: number;
  topology?: MeshTopology;
  /** Target triangle/quad count, 100–300000. */
  target_polycount?: number;
  model_type?: MeshModelType;
  /** Higher-fidelity geometry with finer surface detail. Meshy v7 single-image
   *  only — silently ignored on v6 or when `image_urls` has more than one entry. */
  ultra_mode?: boolean;
  should_remesh?: boolean;
  pose_mode?: MeshPoseMode;
  symmetry_mode?: MeshSymmetryMode;
  /** Steers texturing when `should_texture` is on. */
  texture_prompt?: string;
}

// ── Upscaling and background removal ──────────────────────────────────────────

export interface UpscaleImageRequest extends TeamBillable, Quotable {
  /** https URL of the image to upscale. Required. */
  source_image_url: string;
  /** 2 or 4. Default 2. */
  scale_factor?: 2 | 4;
}

export interface UpscaleVideoRequest extends TeamBillable, Quotable {
  /** https URL of the video to upscale. Required. */
  source_video_url: string;
  /**
   * Which engine runs the upscale. Topaz (the default) is a classical
   * super-resolution pass at 2x/4x. Flux is a FLUX 3 diffusion pass at
   * 1.5x-3x with a precise/creative mode — better detail, several times the
   * credit cost, and limited to MP4 sources under 20s and 50MB.
   */
  model?: 'video_upscale.fal_video_upscaler' | 'video_upscale.flux_video_upscale';
  /** Topaz: 2 or 4. Flux: any value from 1.5 to 3. Default 2. */
  scale_factor?: number;
  /** Flux only. `precise` stays faithful to the source; `creative` (default) adds detail. */
  mode?: 'precise' | 'creative';
  /** Flux only, optional. Guides the creative pass. */
  prompt?: string;
}

export interface RemoveBackgroundRequest extends TeamBillable, ProjectFileable, Quotable {
  /** https URL of the image to cut out. Required. */
  image_url: string;
}

// ── Documents (Firestation Drive) ─────────────────────────────────────────────

export interface GenFireDocument {
  id: string;
  object: 'document';
  title: string;
  kind?: string;
  /** Permanent shareable view URL. */
  url: string;
  bytes: number;
}

export interface CreateDocumentRequest {
  title?: string;
  /** e.g. 'document' | 'deck'. */
  kind?: string;
  /** The document body as HTML. Long documents compose iteratively: create with
   *  the first sections, then {@link GenFireClient.appendDocument} per chunk. */
  html: string;
  description?: string;
}

export interface DocumentMutationResult {
  id: string;
  object: 'document';
  url: string;
  bytes: number;
}

export interface DocumentEditResult extends DocumentMutationResult {
  /** How many occurrences of `find` were replaced. */
  occurrences: number;
}

// ── Skills ────────────────────────────────────────────────────────────────────

export interface SkillFile {
  path: string;
  content: string;
}

export interface Skill {
  id: string;
  object: 'skill';
  title: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  version: string | null;
  content: string | null;
  files: SkillFile[];
  prompt: string | null;
  source: string | null;
  is_public: boolean;
  /** Marketplace listings only. */
  installs?: number;
  owner_name?: string;
}

export interface CreateSkillRequest {
  /** Max 80 chars. Required. */
  title: string;
  /** Defaults to a slugified `title`. */
  slug?: string;
  /** Max 300 chars. */
  description?: string;
  /** Max 40 chars. */
  category?: string;
  /** The SKILL.md markdown body. Provide this or `prompt`. */
  content?: string;
  files?: SkillFile[];
  /** Default '1.0.0'. */
  version?: string;
  /** Alternative to `content` for prompt-only skills. */
  prompt?: string;
  /** Publish to the marketplace immediately after saving. */
  publish?: boolean;
}

export interface SkillVisibility {
  id: string;
  object: 'skill';
  is_public: boolean;
}

// ── Apps and websites (app builder) ───────────────────────────────────────────

export type AppKind = 'app' | 'website';

export interface CreateAppGenerationRequest {
  /** What to build. Required. */
  prompt: string;
  /** Pass an existing app id to ITERATE on it instead of creating a new one. */
  app_id?: string;
  /** 'app' (default) or 'website'. */
  kind?: AppKind;
  /** Spend more tokens for a higher-fidelity build. */
  high_quality?: boolean;
  /** Authoring model override. */
  model?: string;
  /** Up to 16 https asset URLs the build may reference. */
  asset_urls?: string[];
}

export interface DeployAppRequest extends TeamBillable {
  /** One complete <!DOCTYPE html> document — the whole app in a single file.
   *  Must be ≤ 1.5MB and end with </html>. Required. */
  html: string;
  title?: string;
  /** Short description of what was built (max 2000 chars). */
  brief?: string;
  kind?: AppKind;
  /** Redeploy over an existing app id. */
  app_id?: string;
}

export interface AppVisibility {
  id: string;
  is_public: boolean;
}

// ── Social publishing ─────────────────────────────────────────────────────────

export interface SocialAccount {
  platform: string;
  account_id: string;
  username: string | null;
  avatar_url: string | null;
  publish_enabled: boolean;
  /** Stable ref to pass in `targets`, e.g. "tiktok:12345". */
  target: string;
}

export interface SocialAccountsResponse {
  object: 'list';
  data: SocialAccount[];
  /** Send the user here to connect more accounts via OAuth. */
  connect_url: string;
}

export interface CreateSocialPostRequest {
  /** Where to publish — refs from {@link GenFireClient.listSocialAccounts}
   *  (`target`), e.g. ["tiktok:123"]. At least one required. */
  targets: string[];
  /** Publish an existing faceless reel. Provide exactly one source: `reel_id`,
   *  `video_url`, `image_urls`, or (LinkedIn/Facebook text posts) `caption`. */
  reel_id?: string;
  video_url?: string;
  image_urls?: string[];
  /** Single-image convenience alias for `image_urls`. */
  image_url?: string;
  caption?: string;
  /** YouTube video title. */
  title?: string;
  label?: string;
  /** Platform privacy value, e.g. 'public'. */
  privacy?: string;
  /** Epoch ms or an ISO timestamp. Omit to publish now. */
  scheduled_at?: number | string;
  /** IANA zone for `scheduled_at`. Default 'UTC'. */
  timezone?: string;
}

export interface SocialPost {
  id: string;
  status: string;
  /** Echoed back as "platform:account_id" refs. */
  targets: string[];
  scheduled_at_ms: number;
}

export interface SocialLookupResponse {
  data: unknown;
}

// ── Ad research ───────────────────────────────────────────────────────────────

export type AdPlatform = 'meta' | 'google' | 'linkedin' | 'reddit';

export interface SearchAdsParams {
  /** Brand/company name or niche phrase. Provide this or `page_id`. */
  query?: string;
  /** Meta page id (brand mode only). */
  page_id?: string;
  /** Default 'meta'. */
  platform?: AdPlatform;
  /** 'brand' (default) searches one advertiser; 'niche' searches a category. */
  mode?: 'brand' | 'niche';
  /** 1–50. Default 20. */
  limit?: number;
  /** Opaque page cursor from a previous response's `next_cursor`. */
  cursor?: string;
}

export interface SearchAdsResponse {
  object: 'list';
  company: Record<string, unknown> | null;
  data: Array<Record<string, unknown>>;
  next_cursor: string | null;
  note?: string;
}

export interface AnalyzeAdRequest {
  /** Both from a {@link GenFireClient.searchAds} result. Required. */
  page_id: string;
  ad_id: string;
}

export interface AdResearch {
  research_id: string;
  ad: Record<string, unknown>;
  analysis: Record<string, unknown>;
  mirrored_video_url: string | null;
  note?: string;
}

// ── Run scope + price quotes ──────────────────────────────────────────────────
// Three mixins rather than three fields copied onto twenty request types. Each
// says exactly what the route it lands on supports, so a request type that does
// NOT extend one is telling you the API answers 400 there rather than silently
// ignoring the field.

/** `team_id`: which credit pool pays. Routes that cannot bill a pool omit it. */
export interface TeamBillable {
  /**
   * Bill this run to a WORKSPACE (team) credit pool instead of the personal
   * balance. Ids come from `GET /v1/teams`; the key must hold
   * the `teams:read` scope and the caller must be a member with a spending
   * role. A failure here is typed: `team_pool_insufficient`,
   * `team_member_cap`, `team_monthly_cap` or `member_budget_exceeded` — each a
   * different fix, and none of them solved by buying personal credits.
   */
  team_id?: string;
}

/** `project_id`: where the output is filed once it completes. */
export interface ProjectFileable {
  /**
   * File this run's output into a project the moment it completes. Only
   * capabilities whose result is an image, video or audio can file; naming a
   * project on any other route is a 400 `project_filing_unsupported` that says
   * which, rather than a quiet no-op.
   */
  project_id?: string;
}

/** `quote_token`: spend a price you were already shown. */
export interface Quotable {
  /**
   * The `quote_token` from the matching estimate call, to be charged the price
   * that estimate returned. Optional — omit it and the live price applies.
   *
   * The binding is ASYMMETRIC: a quote is a CEILING, never a floor, so if the
   * price dropped you pay the lower one. If it rose beyond the honour band, or
   * the priced inputs changed, the submit is a 409 (`quote_expired` /
   * `quote_mismatch`) carrying a FRESH quote in the problem body — resubmit
   * with that rather than round-tripping back to the estimate call.
   *
   * May also be sent as the `X-Genfire-Quote` header via `options.headers`.
   */
  quote_token?: string;
}

/**
 * The signed price every estimate endpoint now returns alongside the number it
 * always returned. Nothing is persisted server-side: the token IS the quote.
 */
export interface PriceQuote {
  quote_id: string;
  credits: number;
  unit: string;
  breakdown: Record<string, unknown>;
  /** ISO timestamp. Past it, a submit carrying this token is a 409. */
  expires_at: string;
  /** Pass back as `quote_token` on the paired submit. */
  quote_token: string;
}

// ── Media inspection ──────────────────────────────────────────────────────────

export interface InspectMediaRequest {
  /** An https URL, an upload `asset_url`, or a past run id (`run_…`). */
  url: string;
}

/**
 * What ffprobe measured. The keys are the probe's own camelCase, unchanged on
 * the wire. A REQUESTED duration is not a measured one — an 8s request often
 * lands at 6.4s — so read this before trimming, composing or lip-syncing.
 */
export interface MediaInspection {
  object: 'media_inspection';
  source: { kind: 'run' | 'upload' | 'url'; run_id?: string; url: string };
  durationSeconds: number | null;
  /** Coded axes — what an ffmpeg filter argument needs. */
  width: number | null;
  height: number | null;
  /** Rotation applied — what a human sees. Use these to lay out a frame. */
  displayWidth: number | null;
  displayHeight: number | null;
  /** Normalized to [0,360). 90 or 270 means display and coded axes are swapped. */
  rotation: number;
  fps: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  audioSampleRate?: number;
  audioChannels?: number;
  videoCodec?: string;
  audioCodec?: string;
  sizeBytes?: number;
  container?: string;
}

// ── Website captures ──────────────────────────────────────────────────────────

export interface CaptureViewport {
  /** Label for the shot, slugified. Defaults to viewport-1, viewport-2… */
  name?: string;
  width: number;
  height: number;
  /** Emulate a mobile device (touch + device pixel ratio), not just a narrow window. */
  mobile?: boolean;
}

export interface CreateCaptureRequest extends ProjectFileable {
  /** The page to capture. A bare domain is accepted (https is assumed). */
  url: string;
  /** Up to 4 frames. Omit for the default pair: desktop 1440x900, mobile 390x844. */
  viewports?: CaptureViewport[];
  /** Capture the entire scroll height instead of just the fold. */
  full_page?: boolean;
}

// ── Voice conversion (speech-to-speech) ───────────────────────────────────────

export interface CreateVoiceConversionRequest extends TeamBillable, ProjectFileable {
  /** The performance to re-voice. https URL or an upload `asset_url`. */
  audio_url: string;
  /** Target speaker, from {@link GenFireClient.listVoices}. */
  voice_id: string;
  /** ElevenLabs speech-to-speech model id. Defaults to `eleven_multilingual_sts_v2`,
   *  Genfire's choice; the ElevenLabs API's own default is `eleven_english_sts_v2`. */
  model?: string;
  /** Strip room tone and background noise from the source first. */
  remove_background_noise?: boolean;
  /** Title for the resulting clip in the user's library. */
  title?: string;
}

// ── Compose ───────────────────────────────────────────────────────────────────

export interface ComposeClip {
  /** The scene's media: an https URL or a past run id. */
  url: string;
  /** Default 'video'. An 'image' holds for `duration_sec` and can take `motion`. */
  kind?: 'video' | 'image';
  /** THIS scene's voiceover. It moves with the clip through every trim and crossfade. */
  audio_url?: string;
  /** 'replace' (default) swaps the clip's sound; 'mix' keeps it underneath, ducked. */
  audio_mode?: 'replace' | 'mix';
  /** When the line outruns the footage, hold the last frame. Default true. */
  hold_last_frame?: boolean;
  /** Image clips: how long the still holds. Defaults to its audio's length, else 5s. */
  duration_sec?: number;
  trim_in_sec?: number;
  trim_out_sec?: number;
  /** Crossfade INTO this clip, in ms. 0 (default) is a hard cut. */
  transition_ms?: number;
  /** Image clips: Ken-Burns move, e.g. 'kenburns-in', 'kenburns-pan', 'handheld-shake'. */
  motion?: string;
  motion_intensity?: 'subtle' | 'default' | 'punchy';
  mute_audio?: boolean;
}

export interface ComposeTrack {
  url: string;
  /** Absolute seconds on the FINISHED timeline. Default 0. */
  start_sec?: number;
  /** 0-1. Put a music bed at 0.1-0.2 so it sits under the voice. */
  volume?: number;
  loop?: boolean;
  fade_in_sec?: number;
  fade_out_sec?: number;
}

export interface ComposeCaptionWord {
  text: string;
  start_sec: number;
  end_sec: number;
}

export interface ComposeCaptions {
  /** Caption style id. 'none' turns captions off. */
  preset_id: string;
  position?: string;
  animation?: string;
  /**
   * The transcript you already have, burned as WRITTEN: the server
   * force-aligns it to the composed audio and solves only the timing. Pass it
   * whenever you authored the lines — it is the difference between the exact
   * requested wording on screen and a transcriber's guess at it. Mutually
   * exclusive with `words`.
   */
  text?: string;
  /**
   * Timings you ALREADY hold, burned verbatim. Must be ascending and
   * non-overlapping — they are drawn in the order given. Mutually exclusive
   * with `text`.
   */
  words?: ComposeCaptionWord[];
  words_per_line?: number;
}

export interface ComposeVideoRequest extends ProjectFileable {
  /** Scenes in playback order, up to 60. */
  clips: ComposeClip[];
  /** Tracks pinned to absolute timeline positions, up to 32. */
  audio?: ComposeTrack[];
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
  /** 'cover' (default) crops to fill; 'contain' letterboxes. */
  fit?: 'cover' | 'contain';
  transition_ms?: number;
  /** Duck EVERY clip's own audio to this level so the tracks sit on top. */
  clip_audio_volume?: number;
  captions?: ComposeCaptions;
  title?: string;
}

// ── Timelines ─────────────────────────────────────────────────────────────────
// The persisted, re-renderable edit — what compose cannot express. compose
// assembles clips end to end; a timeline places them ON TOP of each other at
// exact positions, stores that, and can be patched and rendered again.

export interface TimelineClipLayout {
  /** Horizontal offset from centre, percent of frame width (-100..100). */
  x: number;
  /** Vertical offset from centre, percent of frame height (-100..100). */
  y: number;
  /** Size relative to the frame, 0.2..3. */
  scale: number;
  /** Degrees clockwise. */
  rotation?: number;
}

export interface TimelineTextStyle {
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
  textColor: string;
  activeColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundOpacity: number;
  captionPresetId?: string;
  captionWords?: Array<{ word: string; start: number; end: number }>;
  captionAnimation?: 'highlight' | 'pop' | 'typewriter' | 'classic';
  blendMode?: 'normal' | 'overlay' | 'screen' | 'multiply' | 'difference';
  gradientColors?: [string, string];
  gradientDirection?: number;
}

/**
 * One clip. Field names are camelCase — the manifest is the video editor's own
 * wire shape, shared verbatim so a timeline the editor would render is a
 * timeline the API accepts.
 */
export interface TimelineClip {
  /** Your id, unique in the timeline. Keep it stable across edits. */
  id: string;
  type: 'video' | 'image' | 'text' | 'audio';
  /** Which `sources[]` entry this plays. Required for every type except `text`. */
  sourceId?: string;
  /** When it starts on the FINISHED timeline, in seconds. */
  startTime: number;
  duration: number;
  /** Seconds into the source to start from — the in-point. Default 0. */
  sourceStartTime?: number;
  /** Level, 0..2. Default 1. */
  volume?: number;
  muted?: boolean;
  /** Z-ORDER, not a lane: 0 is the base layer, higher numbers paint on top. */
  trackIndex?: number;
  layout?: TimelineClipLayout;
  /** `text` clips only. */
  textContent?: string;
  /** `text` clips only. */
  textStyle?: TimelineTextStyle;
  watermarkOpacity?: number;
  previewContainerWidth?: number;
}

/** A source as the CALLER declares it. Stored as the ref, never a resolved URL. */
export interface TimelineSourceInput {
  /** The id clips point at through `sourceId`. Letters, digits, `_` and `-`. */
  id: string;
  /** An https URL, an upload `asset_url`, or a past run id (`run_…`). */
  ref: string;
}

export interface TimelineSourceMeasurement {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  probedAt: string;
}

/** A source as the API STORES it: the ref, plus the resolution taken on write. */
export interface TimelineSource extends TimelineSourceInput {
  kind: 'run' | 'upload' | 'url';
  /** Convenience for reads only — a render always re-resolves from `ref`. */
  url: string;
  measured?: TimelineSourceMeasurement;
}

// ── v2: the keyframed graphics overlay ────────────────────────────────────────
// `manifest.graphics` is the whole of what `version: 2` adds. A v1 manifest is
// a v2 manifest with no graphics, and both render through the same compositor,
// so nothing below is a breaking change to a stored timeline.

/**
 * The eases a layer may name, spelled the way GSAP spells them, and
 * deliberately SMALL: every entry survives a round trip through the composer
 * into a headless render and means the same thing on every host. `power1` is
 * quad and `power2` is cubic; `linear` is emitted as GSAP's `none`.
 */
export const GRAPHICS_EASES = [
  'linear',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'back.out',
  'expo.out'
] as const;
export type GraphicsEase = (typeof GRAPHICS_EASES)[number];

/**
 * The fonts a layer may name. VENDORED into the renderer, not fetched: a name
 * outside this list is rejected at write time rather than silently resolving to
 * whatever the render container happens to have, and there is no fallback
 * family — the face you ask for is the face you get.
 */
export const GRAPHICS_FONTS = ['Inter', 'Outfit'] as const;
export type GraphicsFont = (typeof GRAPHICS_FONTS)[number];

/** Properties a keyframe may drive. `rotateX`/`rotateY` are the 2.5D pair. */
export const GRAPHICS_KEYFRAME_PROPERTIES = [
  'x',
  'y',
  'scale',
  'rotation',
  'opacity',
  'rotateX',
  'rotateY'
] as const;
export type GraphicsKeyframeProperty = (typeof GRAPHICS_KEYFRAME_PROPERTIES)[number];

/** Ceilings. Each one is a memory or render-time bound, not a taste call. */
export const GRAPHICS_LIMITS = {
  maxLayers: 50,
  maxKeyframesPerLayer: 200,
  maxTextLength: 2000
} as const;

/**
 * One keyframe. `t` is ABSOLUTE composition time, not an offset from the
 * layer's `start` — a caller reading the manifest next to a timeline ruler
 * should not have to do arithmetic to know when something happens. Within one
 * property `t` must STRICTLY increase and every `t` must fall inside the
 * layer's `[start, end]`; both are 400 `invalid_graphics`, not a silent
 * reorder. `ease` describes the segment ARRIVING at this keyframe, so it is
 * ignored on a property's first one.
 */
export interface GraphicsKeyframe {
  property: GraphicsKeyframeProperty;
  t: number;
  value: number;
  /** Default `linear`. */
  ease?: GraphicsEase;
}

/**
 * The layer's resting state, in AUTHORING-FRAME pixels (the manifest's own
 * `width` × `height`, never percentages). `x`/`y` place the layer box's
 * top-left corner; `scale` and `rotation` are taken about the box's centre. A
 * property with keyframes ignores its value here and starts from its first
 * keyframe instead.
 */
export interface GraphicsTransform {
  x: number;
  y: number;
  /** Box width in px. Defaults to the rest of the frame (`manifest.width - x`). */
  width?: number;
  /** Box height in px. Text and counters default to auto; shapes and images fill. */
  height?: number;
  /** Default 1. */
  scale?: number;
  /** Degrees clockwise. Default 0. */
  rotation?: number;
  /** 0-1. Default 1. */
  opacity?: number;
}

/**
 * 2.5D. `perspective` is the viewing distance in px; without it a `rotateX`
 * reads as a flat vertical squash rather than a tilt.
 */
export interface GraphicsTransform3d {
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
}

/**
 * A mask on the layer box, expressed in FRACTIONS of that box (0-1) rather
 * than pixels, so a mask lands identically at preview and final scale — the
 * same invariant the render resolution keeps. `x + width` and `y + height`
 * must be <= 1. `rect` and `ellipse` become a CSS `clip-path`; `image` becomes
 * a `mask-image` whose alpha is the matte.
 */
export interface GraphicsMask {
  kind: 'rect' | 'ellipse' | 'image';
  /** Fractions of the layer box. Default 0, 0, 1, 1 — the whole box. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** `rect` only. Corner radius as a fraction of the box's short edge. */
  radius?: number;
  /** `image` only. Same ref rules as an image layer's `src`. */
  src?: string;
}

/** How a text layer arrives. `unit` is what gets staggered. */
export interface GraphicsTextEntrance {
  kind: 'fade-up' | 'pop' | 'typewriter' | 'slide' | 'blur-in';
  /** Default `word`. */
  unit?: 'word' | 'char' | 'line';
  /** Seconds between successive units. Default 0.06. */
  stagger?: number;
  /** Seconds each unit takes. Default 0.6. */
  duration?: number;
}

/** How a counter's number is written out. No locale involved. */
export interface GraphicsCounterFormat {
  /** `integer` rounds, `decimal1` keeps one place, `percent` appends `%`. */
  style?: 'integer' | 'decimal1' | 'percent';
  prefix?: string;
  suffix?: string;
  /** Thousands separators. Off by default, so a year does not become "2,026". */
  group?: boolean;
}

export interface GraphicsLayerBase {
  /** Unique in the manifest, and the rendered element's id: `[A-Za-z0-9][A-Za-z0-9_-]{0,63}`. */
  id: string;
  start: number;
  end: number;
  /** Paint order inside the overlay. Higher paints on top; ties break on `id`. */
  z?: number;
  transform: GraphicsTransform;
  transform3d?: GraphicsTransform3d;
  keyframes?: GraphicsKeyframe[];
  mask?: GraphicsMask;
}

/** Colours are hex (`#rgb`, `#rrggbb`, `#rrggbbaa`) or `rgb()`/`rgba()`. Named colours and `var()` are rejected. */
export interface GraphicsTextLayer extends GraphicsLayerBase {
  kind: 'text';
  /** At most {@link GRAPHICS_LIMITS}.maxTextLength characters. */
  text: string;
  font?: GraphicsFont;
  /** px in the authoring frame. Default 48. */
  size?: number;
  /** 100-900 — the vendored faces are variable, so any value is real. Default 700. */
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  entrance?: GraphicsTextEntrance;
}

export interface GraphicsImageLayer extends GraphicsLayerBase {
  kind: 'image';
  /**
   * An https URL, or `source:<id>` naming an entry in the manifest's own
   * `sources[]` — the second form is the one that survives a signed URL
   * expiring, for the same reason a source stores its ref and not a URL.
   */
  src: string;
  fit?: 'cover' | 'contain' | 'fill';
  /** Corner radius in authoring-frame px. */
  radius?: number;
}

export interface GraphicsShapeLayer extends GraphicsLayerBase {
  kind: 'shape';
  shape?: 'rect' | 'ellipse' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
}

export interface GraphicsCounterLayer extends GraphicsLayerBase {
  kind: 'counter';
  from?: number;
  to: number;
  font?: GraphicsFont;
  size?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  format?: GraphicsCounterFormat;
  /** The ease of the COUNT itself, independent of any transform keyframes. Default `power2.out`. */
  ease?: GraphicsEase;
}

export type GraphicsLayer =
  | GraphicsTextLayer
  | GraphicsImageLayer
  | GraphicsShapeLayer
  | GraphicsCounterLayer;

/**
 * The graphics block of a `version: 2` manifest.
 *
 * Rendered into ONE full-frame transparent track and composited over the
 * footage in a single pass, so it never touches your clips or your audio.
 * Z-ORDER is footage < graphics < captions, because a caption must always be
 * readable; `aboveCaptions` flips the last pair for the case where the
 * graphics ARE the design.
 *
 * A bad field is 400 `invalid_graphics` naming `graphics.layers[N].field`, and
 * it is raised BEFORE any source is resolved or probed. Whether the layers FIT
 * is answered at RENDER time instead: an overflowing layer fails the render run
 * with `graphics_layout_invalid` carrying what the layout audit measured, and a
 * font the renderer cannot find is `graphics_font_missing`. Both are terminal —
 * neither improves on a retry.
 */
export interface TimelineGraphics {
  /** At most {@link GRAPHICS_LIMITS}.maxLayers. */
  layers: GraphicsLayer[];
  aboveCaptions?: boolean;
}

export interface TimelineManifest {
  /** 1, or 2 when `graphics` is present. Nothing else distinguishes them. */
  version: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  clips: TimelineClip[];
  sources: TimelineSource[];
  /** `version: 2` only. Absent on every v1 manifest. */
  graphics?: TimelineGraphics;
}

export interface Timeline {
  id: string;
  object: 'timeline';
  /** Monotonic. Every manifest write bumps it; it is the concurrency token. */
  rev: number;
  /** sha256 over the manifest's stable JSON — the identity of the CONTENT. */
  manifest_hash: string;
  title: string | null;
  project_id: string | null;
  manifest: TimelineManifest;
  created_at: string;
  updated_at: string;
}

/** The manifest as a caller writes it. Identical on create and update. */
export interface TimelineManifestInput {
  /** Total length of the finished film, seconds. Must cover every clip. */
  duration: number;
  /** Frame width in pixels, 16-3840. Stated, never derived from a preset. */
  width: number;
  /** Frame height in pixels, 16-3840. */
  height: number;
  /** 1-120. Default 30. */
  fps?: number;
  clips: TimelineClip[];
  sources: TimelineSourceInput[];
  /**
   * Keyframed overlay layers. Sending it stores the manifest at `version: 2`;
   * omitting it leaves it at `version: 1`, hashing exactly as it did before.
   *
   * On {@link UpdateTimelineRequest} this replaces WHOLE like everything else
   * in the manifest, so omitting the block on a PATCH DELETES the overlay and
   * takes the timeline back to v1.
   */
  graphics?: TimelineGraphics;
  title?: string;
}

export interface CreateTimelineRequest extends TimelineManifestInput, TeamBillable, ProjectFileable {}

export interface UpdateTimelineRequest extends TimelineManifestInput {
  /**
   * The `rev` the last read reported. REQUIRED: without it the API answers 428
   * rather than last-write-wins, and a stale one is a 409. Sent as `If-Match`
   * when {@link GenFireClient.updateTimeline} is given it this way.
   */
  rev: number;
}

export interface RenderTimelineRequest {
  /**
   * `preview` (default) is the SAME compositor at 480p on the short edge — an
   * honest proxy for the final, not a second renderer — and its bytes are
   * cached by manifest content, so re-rendering an unchanged revision reports
   * `output.cached` and costs one pass. `final` is the stated frame.
   */
  mode?: 'preview' | 'final';
  /** Guard, not a selector: render only if the timeline is still at this rev. */
  rev?: number;
}

/** Shape of `run.output` for a completed timeline render. */
export interface TimelineRenderOutput {
  video_url: string;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  mode: 'preview' | 'final';
  rev: number;
  /** What ffprobe read back off the finished file, or null if it could not. */
  measured: {
    duration_seconds: number | null;
    width: number | null;
    height: number | null;
    fps: number | null;
    has_audio: boolean;
    probed_at: string;
  } | null;
  /** True when the bytes came from an earlier render of the same content. */
  cached: boolean;
  /**
   * `version: 2` renders only. How much overlay there was and what it cost, so
   * a slow render can be attributed to the graphics or to the footage.
   */
  graphics?: {
    layers: number;
    frames: number;
    render_ms: number;
  };
}

// ── Presets + canvas workflows ────────────────────────────────────────────────

export interface PresetInput {
  /** The key to use in {@link RunPresetRequest.inputs}. */
  name: string;
  type?: string;
  label?: string;
  description?: string;
  default?: unknown;
  node_id?: string;
  param?: string;
}

export interface Preset {
  id: string;
  object: 'preset';
  title: string;
  description?: string | null;
  /** Build {@link RunPresetRequest.inputs} from these, not from the prose. */
  inputs: PresetInput[];
  /** Credits at the preset's own defaults. */
  cost_credits?: number;
  /** One-time unlock price, when this is a paid preset. */
  price_credits?: number | null;
  [key: string]: unknown;
}

/** One node's share of an estimate. */
export interface CostEstimateNode {
  node_id: string;
  kind: string;
  credits: number;
  /** Already computed from these inputs, so free to re-run. */
  cached?: boolean;
}

/** Price a preset run without starting one. Free; creates nothing. */
export interface EstimatePresetRequest extends TeamBillable, ProjectFileable {
  /** Flat `{ name: value }` over the preset's own `inputs[]`. Part of the quote's hash. */
  inputs?: Record<string, string | number | boolean | null>;
}

/**
 * What {@link GenFireClient.estimatePreset} returns.
 *
 * The same `canvas_workflow_run` capability {@link WorkflowCostEstimate}
 * carries, quoted over a preset id and rev instead of a workflow id and node
 * selection — which is exactly why a token from one is a 409 on the other's
 * submit.
 */
export interface PresetCostEstimate extends Omit<PriceQuote, 'breakdown'> {
  object: 'cost_estimate';
  /** Per node, with the ones already `cached` marked. */
  breakdown: CostEstimateNode[];
  preset_id: string;
  /** The preset revision this price was taken against. Part of the quote's hash. */
  preset_rev: number | null;
  /** Every runnable node — a preset run selects them all, so nothing is served from cache. */
  selected_node_ids: string[];
}

/**
 * {@link Quotable} since the preset estimate endpoint landed: that call hashes
 * its quote over `{presetId, presetRev, inputs}`, which is exactly what this
 * route verifies. A token from {@link estimateUserWorkflow} is the same
 * capability hashed over a workflow id and a node selection, so passing one
 * here is a 409 `quote_mismatch` — the token must come from
 * {@link GenFireClient.estimatePreset}.
 */
export interface RunPresetRequest extends TeamBillable, ProjectFileable, Quotable {
  /** Flat `{ name: value }` over the preset's own `inputs[]`. */
  inputs?: Record<string, string | number | boolean | null>;
  /**
   * Pay a paid preset's one-time unlock. Send it only after a 402
   * `preset_purchase_required` has told you the price AND the user agreed.
   */
  confirm_purchase?: boolean;
}

export interface PresetRun {
  object: 'preset_run';
  presetId: string;
  presetVersion: number | null;
  /**
   * The caller's own instantiated copy. A preset run IS a canvas run, filed
   * under that copy — read it with `getUserWorkflowRun(workflowId, runId)`.
   * {@link getRun} looks in the flat run collection and answers 404
   * `run_not_found` for it.
   */
  workflowId: string;
  runId: string;
  totalCostCredits: number;
  pageId: string;
  selectedNodeIds: string[];
}

/**
 * Which page, which nodes and which overrides a canvas call targets.
 *
 * Shared by {@link EstimateUserWorkflowRequest} and
 * {@link RunUserWorkflowRequest} for the reason the API shares one parser
 * between the two routes: a quote is only worth something if it was priced
 * against the identical target the run submits, and two shapes would drift on
 * the first field either side gained.
 */
export interface UserWorkflowRunTarget {
  /** Which page of the canvas. Defaults to the first one. */
  page_id?: string;
  /** Only these nodes AND everything they depend on. Omit for the page's Export nodes and generation leaves. */
  selected_node_ids?: string[];
  /**
   * Per-run parameter overrides, keyed by NODE and two levels deep:
   * `{ "<node_id>": { "<param>": value } }`. A flat `"node.param"` key is a
   * 400 `invalid_param_overrides`. Values are primitives; 50KB in total.
   */
  param_overrides?: Record<string, Record<string, string | number | boolean | null>>;
}

export interface EstimateUserWorkflowRequest extends UserWorkflowRunTarget {}

/**
 * Deliberately NOT {@link TeamBillable} or {@link ProjectFileable}, and both
 * omissions are the route's: the canvas bills the workspace the workflow
 * itself belongs to (`team_id` is a 400 `team_billing_unsupported` telling you
 * to move the workflow), and its nodes file their own outputs (`project_id` is
 * a 400 `project_filing_unsupported`).
 */
export interface RunUserWorkflowRequest extends UserWorkflowRunTarget, Quotable {}

/** What a kickoff returns. 202 — nothing has finished yet. */
export interface UserWorkflowRun {
  /**
   * The canvas the run belongs to — echoed back from the call, since a canvas
   * run is addressed UNDER its workflow. Read it with
   * `getUserWorkflowRun(workflowId, runId)`; {@link getRun} looks in the flat
   * run collection and answers 404 `run_not_found` for it.
   */
  workflowId: string;
  runId: string;
  totalCostCredits: number;
  pageId: string;
  /** The selection the server RESOLVED, which is the default one when you sent none. */
  selectedNodeIds: string[];
}

/** One node's state inside a canvas run. */
export interface UserWorkflowNodeExecution {
  nodeId: string;
  status: string;
  error?: string;
  output: { type: string; url?: string; text?: string } | null;
}

export interface UserWorkflowRunDeliverable {
  node_id: string;
  kind: string;
  output: { type: string; url?: string; text?: string };
}

export interface UserWorkflowRunStatus {
  runId: string;
  workflowId: string;
  pageId: string;
  status: string;
  totalCostCredits: number;
  /**
   * The graph revision this run actually executed — null on runs started
   * before runs pinned one. It is what tells a run apart from the canvas as it
   * stands now.
   */
  workflowRev: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  nodes: UserWorkflowNodeExecution[];
  /**
   * `deliverables` are the ANSWER — the nodes the user asked for; the
   * `intermediates` are the work that produced it. Show the deliverables and
   * reach into the intermediates only when asked how something was made.
   */
  output: {
    deliverables: UserWorkflowRunDeliverable[];
    intermediates: UserWorkflowRunDeliverable[];
  };
}

export interface WorkflowCostEstimate extends Omit<PriceQuote, 'breakdown'> {
  object: 'cost_estimate';
  /** Per node: which ones are already `cached` and therefore free to re-run. */
  breakdown: CostEstimateNode[];
  /** The graph revision this price was taken against. */
  workflow_rev: number | null;
  page_id: string;
  selected_node_ids: string[];
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export type UsageGroupBy = 'model' | 'capability' | 'day' | 'none';

export interface UsageBreakdownEntry {
  group: string;
  credits_spent: number;
  runs_count: number;
  successful_runs: number;
  failed_runs: number;
  avg_credits_per_run: number;
}

export interface UsageSummary {
  object: 'usage_summary';
  period: { start: string; end: string };
  group_by: UsageGroupBy;
  totals: {
    credits_spent: number;
    runs_count: number;
    successful_runs: number;
    failed_runs: number;
  };
  breakdown: UsageBreakdownEntry[];
}

export interface GetUsageParams {
  /** ISO date. Defaults to 30 days ago. */
  start_date?: string;
  /** ISO date. Defaults to now. */
  end_date?: string;
  /** Default 'model'. */
  group_by?: UsageGroupBy;
  /** Restrict to one capability, e.g. 'video_generation'. */
  capability?: string;
  /**
   * Report a WORKSPACE's spend instead of this account's. Not a filter: a
   * pool's spend lives in the pool's own ledger, never on this account's run
   * docs, so this switches the SOURCE. Needs membership and `teams:read`.
   */
  team_id?: string;
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

  /**
   * Get the EXACT credit cost for a specific generation config (resolution,
   * duration, audio, count, quality, 3D add-ons). Unlike listPricing() which
   * returns a base per-unit rate, this equals what will actually be billed.
   */
  estimateCost(input: EstimateCostRequest, signal?: AbortSignal): Promise<CostEstimate> {
    return this.request<CostEstimate>('POST', '/models/estimate-cost', { body: input, signal });
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

  /**
   * Create a reusable influencer character, either FROM PHOTOS (`photoUrls` — a
   * real person cloned from 1–8 reference photos) or FROM SCRATCH (`appearance`
   * — a brand-new person generated from described traits). Provide exactly one.
   *
   * This is **asynchronous** and **billable**: the influencer is returned in
   * `status: "creating"`, and BOTH identity artefacts are generated server-side
   * (~60–90s) — a hero photo (`faceUrl`), then the 4-panel reference sheet
   * derived from it (`sheetUrl`). Poll `getInfluencer(id)` until `status` is
   * `ready` (or `failed`). For from-photos, `photoUrls` must be absolute https
   * URLs; upload local files with `uploadFile()` first.
   */
  createInfluencer(options: CreateInfluencerOptions): Promise<Influencer> {
    const body: Record<string, unknown> =
      options.appearance && !options.photoUrls
        ? { handle: options.handle, appearance: options.appearance }
        : { handle: options.handle, photo_urls: options.photoUrls };
    return this.request<Influencer>('POST', '/influencers', {
      body,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal
    });
  }

  /** List your reusable image elements (named props referenced by `@handle`). */
  listElements(signal?: AbortSignal): Promise<ListResponse<Element>> {
    return this.request<ListResponse<Element>>('GET', '/elements', { signal });
  }

  getElement(elementId: string, signal?: AbortSignal): Promise<Element> {
    return this.request<Element>('GET', `/elements/${encodeURIComponent(elementId)}`, { signal });
  }

  /**
   * Create a reusable image element from a single image URL. Synchronous and
   * free (no generation) — returns the element in `ready` status immediately.
   * Reference it later by writing `@handle` in a video generation prompt on a
   * reference-capable model (Seedance, Veo 3.1 reference, Gemini Omni Flash reference, or Grok reference).
   * `imageUrl` must be an absolute https URL; upload local files with
   * `uploadFile()` first and pass the returned `asset_url`.
   */
  createElement(options: CreateElementOptions): Promise<Element> {
    return this.request<Element>('POST', '/elements', {
      body: {
        name: options.name,
        image_url: options.imageUrl,
        handle: options.handle,
        aspect_ratio: options.aspectRatio
      },
      signal: options.signal
    });
  }

  async deleteElement(elementId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<void> {
    await this.request<void>('DELETE', `/elements/${encodeURIComponent(elementId)}`, {
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Ingest a website URL into a brand profile (logo, colors, fonts, structured
   * voice, screenshots, scraped products). Free — no credits are charged.
   * Asynchronous: returns a queued run; poll `getRun()` (typically 30–90s) and
   * read `output.brand_id` from the completed run, then call `getBrand()`.
   */
  createBrandFromUrl(url: string, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/brands/ingestions', {
      body: { url },
      idempotencyKey: options.idempotencyKey ?? `brand_ingest_${Date.now()}`,
      signal: options.signal
    });
  }

  /** List your stored brand profiles. */
  listBrands(signal?: AbortSignal): Promise<ListResponse<Brand>> {
    return this.request<ListResponse<Brand>>('GET', '/brands', { signal });
  }

  /** Get a full brand profile (including its scraped products). */
  getBrand(brandId: string, signal?: AbortSignal): Promise<Brand> {
    return this.request<Brand>('GET', `/brands/${encodeURIComponent(brandId)}`, { signal });
  }

  /** Edit brand fields (name, tagline, description, colors, voice, style, …). */
  updateBrand(brandId: string, fields: Partial<Pick<Brand, 'name' | 'tagline' | 'description' | 'style' | 'logo_url' | 'icon_url' | 'colors' | 'fonts' | 'voice' | 'default_language' | 'default_country' | 'image_urls'>>, signal?: AbortSignal): Promise<Brand> {
    return this.request<Brand>('PATCH', `/brands/${encodeURIComponent(brandId)}`, { body: fields, signal });
  }

  async deleteBrand(brandId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<void> {
    await this.request<void>('DELETE', `/brands/${encodeURIComponent(brandId)}`, {
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Add a product to a brand. Pass `{ url }` to scrape a product page (auto-pulls
   * name/price/description/images), or manual fields `{ name, price?, description?,
   * images?, source_url?, usps? }`. Products become real generation references,
   * so on-brand generation (brand_id) features the actual product.
   */
  addBrandProduct(
    brandId: string,
    product: { url: string } | { name: string; price?: string; description?: string; images?: string[]; source_url?: string; usps?: string[] },
    signal?: AbortSignal,
  ): Promise<BrandProduct> {
    return this.request<BrandProduct>('POST', `/brands/${encodeURIComponent(brandId)}/products`, { body: product, signal });
  }

  async deleteBrandProduct(brandId: string, productId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<void> {
    await this.request<void>('DELETE', `/brands/${encodeURIComponent(brandId)}/products/${encodeURIComponent(productId)}`, {
      signal: options.signal,
      headers: options.headers
    });
  }

  listRuns(params: ListRunsParams = {}, signal?: AbortSignal): Promise<ListResponse<Run>> {
    return this.request<ListResponse<Run>>('GET', '/runs', {
      query: {
        status: params.status,
        capability: params.capability,
        limit: params.limit,
        q: params.q,
        starting_after: params.starting_after,
        created_after: params.created_after,
        created_before: params.created_before,
        max_scan: params.max_scan,
        team_id: params.team_id,
        project_id: params.project_id
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

  listBatchItems(batchId: string, params: ListBatchItemsParams = {}, signal?: AbortSignal): Promise<ListResponse<BatchItem>> {
    return this.request<ListResponse<BatchItem>>('GET', `/batches/${encodeURIComponent(batchId)}/items`, {
      query: { status: params.status, limit: params.limit },
      signal
    });
  }

  /**
   * ONE item of a batch — its index, custom_id, attempt, status, run_id,
   * output and error — instead of re-reading the whole grid to answer one
   * question.
   */
  getBatchItem(batchId: string, itemId: string, signal?: AbortSignal): Promise<BatchItem> {
    return this.request<BatchItem>(
      'GET',
      `/batches/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}`,
      { signal }
    );
  }

  /**
   * Re-run ONE `failed` item. Per item, not per batch: one provider timeout in
   * a 50-item job should not mean re-paying for the 49 that worked.
   *
   * THIS BILLS AGAIN, exactly like submitting that item fresh — there is no
   * idempotency key to replay it against, and a duplicate retry already in
   * flight is a 409. A completed item is never re-run. The item keeps its
   * `index` and `custom_id`; its `attempt` increments.
   */
  retryBatchItem(batchId: string, itemId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<BatchItem> {
    return this.request<BatchItem>(
      'POST',
      `/batches/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}/retry`,
      { signal: options.signal, headers: options.headers }
    );
  }

  createBatch(input: CreateBatchRequest, options: RequestOptions = {}): Promise<BatchWithItems> {
    return this.request<BatchWithItems>('POST', '/batches', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  async waitForBatch(batchId: string, options: WaitForBatchOptions = {}): Promise<Batch> {
    const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 5_000;
    const startedAt = Date.now();

    while (true) {
      const batch = await this.getBatch(batchId, options.signal);
      options.onTick?.(batch, Date.now() - startedAt);
      if (batch.status === 'completed' || batch.status === 'failed' || batch.status === 'partial') {
        return batch;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(`Timed out waiting for batch ${batchId}.`);
      }

      await sleep(intervalMs, options.signal);
    }
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

  // ── Genfire Gedi ────────────────────────────────────────────────────────────

  /**
   * The Gedi recipe book: 25 video-EDIT recipes across six families and 6
   * MOTION-TRANSFER recipes, each with the prompt already written in the
   * `@Video1` / `@Image1` idiom Seedance 2.5 binds on. Free.
   *
   * Run one with {@link createVideoGeneration}:
   * ```ts
   * const { edit_presets } = await client.listGediPresets({ group: 'swap' });
   * const preset = edit_presets.find((p) => p.id === 'swap-product')!;
   * await client.createVideoGeneration({
   *   model: 'video.seedance_2_5',
   *   task: preset.task,                       // 'editing'
   *   prompt: preset.prompt,
   *   reference_video_urls: ['https://…/ad-cut.mp4'],   // @Video1
   *   reference_image_urls: ['https://…/new-bottle.png'] // @Image1
   * });
   * ```
   * An editing run follows the source clip, so omit `aspect_ratio` and `duration`.
   */
  listGediPresets(
    params: { group?: GediEditGroup | string } = {},
    signal?: AbortSignal
  ): Promise<GediPresets> {
    const query = params.group ? { group: params.group } : undefined;
    return this.request<GediPresets>('GET', '/videos/gedi/presets', { query, signal });
  }

  /**
   * The curated Motion Library — reference clips whose motion can be
   * transferred onto your own character or product. Free; an empty array when
   * nothing is published yet. Bring your own clip instead whenever you have one.
   */
  async listGediMotionLibrary(
    params: { limit?: number } = {},
    signal?: AbortSignal
  ): Promise<GediMotion[]> {
    const query = params.limit !== undefined ? { limit: params.limit } : undefined;
    const response = await this.request<ListResponse<GediMotion>>('GET', '/videos/gedi/motion-library', { query, signal });
    return response.data;
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
   * Build a fully-playable, self-contained HTML browser game from a prompt.
   * Async — returns a queued Run; the codegen runs on a worker (usually 1–3
   * min). Poll it with `waitForRun`, then read `run.output` for `game_id`,
   * `play_url` (a public, shareable hosted URL — no install), `thumbnail_url`,
   * and `title`. Iterate on an existing game by passing `game_id` with a change
   * prompt.
   */
  generateGame(input: CreateGameGenerationRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/games/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Publish a completed game you own to the public Genfire games gallery
   * (genfire.ai/games), or unpublish it with `publish: false`. The game's
   * `play_url` is shareable whether or not it is published — this only controls
   * the public marketplace listing.
   */
  publishGame(gameId: string, publish = true, options: RequestOptions = {}): Promise<PublishGameResponse> {
    return this.request<PublishGameResponse>('POST', `/games/${encodeURIComponent(gameId)}/publish`, {
      body: { publish },
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

  /**
   * Generate a vertical (9:16) faceless reel end-to-end (script → voiceover →
   * style-locked images → music → captioned video). Async — returns a Run in
   * `processing`; poll it with {@link waitForRun} until completed, then read
   * `run.output.video_url`.
   */
  createFacelessReel(input: CreateFacelessReelRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/faceless-reels/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Per-config credit estimate for a faceless reel, without generating. */
  estimateFacelessReelCost(input: EstimateFacelessReelCostRequest = {}, signal?: AbortSignal): Promise<FacelessReelCostEstimate> {
    return this.request<FacelessReelCostEstimate>('POST', '/faceless-reels/estimate-cost', { body: input, signal });
  }

  /** List niche presets accepted as `preset_id`. */
  listFacelessReelPresets(signal?: AbortSignal): Promise<ListResponse<Record<string, any>>> {
    return this.request<ListResponse<Record<string, any>>>('GET', '/faceless-reels/presets', { signal });
  }

  /** List visual styles accepted as `style_id`. */
  listFacelessReelStyles(signal?: AbortSignal): Promise<ListResponse<Record<string, any>>> {
    return this.request<ListResponse<Record<string, any>>>('GET', '/faceless-reels/styles', { signal });
  }

  /** List curated background-music tracks (music.source 'preset'). */
  listFacelessReelMusicPresets(signal?: AbortSignal): Promise<ListResponse<Record<string, any>>> {
    return this.request<ListResponse<Record<string, any>>>('GET', '/faceless-reels/music-presets', { signal });
  }

  /** List caption font/animation presets accepted as `caption_preset_id`. */
  listFacelessReelCaptionPresets(signal?: AbortSignal): Promise<ListResponse<Record<string, any>>> {
    return this.request<ListResponse<Record<string, any>>>('GET', '/faceless-reels/caption-presets', { signal });
  }

  /** List your recurring reel subscriptions ("Stories"). */
  listFacelessReelSubscriptions(signal?: AbortSignal): Promise<ListResponse<FacelessReelSubscription>> {
    return this.request<ListResponse<FacelessReelSubscription>>('GET', '/faceless-reels/subscriptions', { signal });
  }

  /** Create a recurring reel subscription. */
  createFacelessReelSubscription(input: FacelessReelSubscriptionInput, signal?: AbortSignal): Promise<FacelessReelSubscription> {
    return this.request<FacelessReelSubscription>('POST', '/faceless-reels/subscriptions', { body: input, signal });
  }

  /** Update a reel subscription. Changing cadence/slots/timezone reschedules it. */
  updateFacelessReelSubscription(id: string, input: FacelessReelSubscriptionInput, signal?: AbortSignal): Promise<FacelessReelSubscription> {
    return this.request<FacelessReelSubscription>('PATCH', `/faceless-reels/subscriptions/${encodeURIComponent(id)}`, { body: input, signal });
  }

  /** Delete a reel subscription. */
  deleteFacelessReelSubscription(id: string, signal?: AbortSignal): Promise<{ object: 'reel_subscription'; id: string; deleted: boolean }> {
    return this.request<{ object: 'reel_subscription'; id: string; deleted: boolean }>('DELETE', `/faceless-reels/subscriptions/${encodeURIComponent(id)}`, { signal });
  }

  /**
   * Generate one reel now for a subscription, using its settings. Async —
   * returns a Run; poll {@link waitForRun}. Throws on 409 if a reel is already
   * generating for that subscription.
   */
  runFacelessReelSubscriptionNow(id: string, input: { topic?: string } = {}, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', `/faceless-reels/subscriptions/${encodeURIComponent(id)}/run-now`, {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Generate an explainer film end-to-end (script → voiceover → style-locked
   * frames → per-scene video clips → composed film). 20s–10min, 16:9 or 9:16.
   * Pass a structured `script` to author every beat yourself — Genfire then
   * makes zero internal LLM calls and purely renders. Async — returns a Run in
   * `processing`; poll it with {@link waitForRun}. Long films render for a
   * while (up to ~30 minutes for a 10-minute film), so pass a large
   * `timeoutMs` (e.g. `45 * 60 * 1000`). The completed `run.output` is
   * `{ reel_id, video_url, script, scenes, duration_seconds }`.
   */
  createExplainer(input: CreateExplainerRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/explainers/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Per-config credit estimate for an explainer, without generating. */
  estimateExplainerCost(input: EstimateExplainerCostRequest = {}, signal?: AbortSignal): Promise<ExplainerCostEstimate> {
    return this.request<ExplainerCostEstimate>('POST', '/explainers/estimate-cost', { body: input, signal });
  }

  /** List explainer visual style presets accepted as `style_id`. */
  async listExplainerStyles(signal?: AbortSignal): Promise<ExplainerStyle[]> {
    const response = await this.request<ListResponse<ExplainerStyle>>('GET', '/explainers/styles', { signal });
    return response.data;
  }

  /**
   * Generate an auto-directed AI music video from a song (song → beat/section
   * analysis → style-locked anchor frame → per-scene video clips cut to the
   * music → composed video with optional lyric captions). 9:16 or 16:9. Bring
   * your own track via `song_url`, or pass an inline `song` prompt and Genfire
   * generates (and separately bills) the track first. Async — returns a Run in
   * `processing`; poll it with {@link waitForRun} (long render — pass a large
   * `timeoutMs`). The completed `run.output` is `{ reel_id, video_url, script,
   * scenes, duration_seconds }`.
   */
  createMusicVideo(input: CreateMusicVideoRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/music-videos/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Per-config credit estimate for a music video's video-production stage,
   *  without generating (the song's own cost is not included). */
  estimateMusicVideoCost(input: EstimateMusicVideoCostRequest, signal?: AbortSignal): Promise<MusicVideoCostEstimate> {
    return this.request<MusicVideoCostEstimate>('POST', '/music-videos/estimate-cost', { body: input, signal });
  }

  /** List music-video visual style presets accepted as `style_preset_id`. */
  async listMusicVideoStyles(signal?: AbortSignal): Promise<MusicVideoStyle[]> {
    const response = await this.request<ListResponse<MusicVideoStyle>>('GET', '/music-videos/styles', { signal });
    return response.data;
  }

  // ── Picture books ─────────────────────────────────────────────────────────

  /**
   * Write and illustrate a complete picture book with a consistent cast from
   * an `idea` (the free planner writes the text) or your own `script`. Async —
   * returns a Run in `processing`; poll it with {@link waitForRun} (minutes;
   * `progress` carries the anchor → sheets → pages → covers stages). The run's
   * `resource_id` / `output.book_id` is the book id: read it with
   * {@link getPictureBook} and export files with {@link exportPictureBook}.
   * The studio link is https://genfire.ai/dashboard/books/{book_id}.
   */
  createPictureBook(input: CreatePictureBookRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/picture-books/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Plan + price a picture book without generating it (same input as
   *  {@link createPictureBook}); returns the planned title/pages/cast too. */
  estimatePictureBookCost(input: CreatePictureBookRequest, signal?: AbortSignal): Promise<PictureBookCostEstimate> {
    return this.request<PictureBookCostEstimate>('POST', '/picture-books/estimate-cost', { body: input, signal });
  }

  /** The Picture Book Studio catalog: styles, formats, age bands, export kinds. */
  listPictureBookStyles(signal?: AbortSignal): Promise<PictureBookCatalog> {
    return this.request<PictureBookCatalog>('GET', '/picture-books/styles', { signal });
  }

  /** One picture book: status, progress, cast, every page (with art URLs), exports. */
  getPictureBook(bookId: string, signal?: AbortSignal): Promise<PictureBook> {
    return this.request<PictureBook>('GET', `/picture-books/${encodeURIComponent(bookId)}`, { signal });
  }

  /** Export a picture book (free): interior-pdf | cover-pdf | ebook-pdf | images-zip. */
  exportPictureBook(bookId: string, kind: PictureBookExportKind, signal?: AbortSignal): Promise<PictureBookExport> {
    return this.request<PictureBookExport>('POST', `/picture-books/${encodeURIComponent(bookId)}/export`, { body: { kind }, signal });
  }

  // ── Coloring books ────────────────────────────────────────────────────────

  /**
   * Draw a complete black-and-white coloring book from your own `plan` (a list
   * of page subjects, drawn as written) or a `theme` the free planner turns
   * into one. Async — returns a Run in `processing`; poll it with
   * {@link waitForRun} (minutes). The run's `resource_id` / `output.book_id`
   * is the book id: read it with {@link getColoringBook} and export files with
   * {@link exportColoringBook}. The studio link is
   * https://genfire.ai/dashboard/coloring-books/{book_id}.
   *
   * This is NOT a picture book: there is no story, no words on the pages and
   * no continuity between them. One line anchor fixes the stroke weight and
   * every page is drawn from it; the only colour image is the cover.
   */
  createColoringBook(input: CreateColoringBookRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/coloring-books/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Plan + price a coloring book without drawing it (same input as
   * {@link createColoringBook}). Returns every page's subject and how many
   * interior pages the book will actually PRINT — worth reading back before
   * committing to a hundred-page run.
   */
  estimateColoringBookCost(input: CreateColoringBookRequest, signal?: AbortSignal): Promise<ColoringBookCostEstimate> {
    return this.request<ColoringBookCostEstimate>('POST', '/coloring-books/estimate-cost', { body: input, signal });
  }

  /** The Coloring Book Studio catalog: subject worlds, trims, complexities, export kinds. */
  listColoringBookStyles(signal?: AbortSignal): Promise<ColoringBookCatalog> {
    return this.request<ColoringBookCatalog>('GET', '/coloring-books/styles', { signal });
  }

  /** One coloring book: status, progress, every page (with art URLs), print settings, exports. */
  getColoringBook(bookId: string, signal?: AbortSignal): Promise<PictureBook> {
    return this.request<PictureBook>('GET', `/coloring-books/${encodeURIComponent(bookId)}`, { signal });
  }

  /** Export a coloring book (free): interior-pdf (black & white) | cover-pdf (colour wrap) | ebook-pdf | images-zip. */
  exportColoringBook(bookId: string, kind: PictureBookExportKind, signal?: AbortSignal): Promise<PictureBookExport> {
    return this.request<PictureBookExport>('POST', `/coloring-books/${encodeURIComponent(bookId)}/export`, { body: { kind }, signal });
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

  // ── 3D models ───────────────────────────────────────────────────────────────

  /**
   * Generate a 3D mesh from one image, or from 1–4 images of the same object
   * shot from different angles (multi-image-to-3D, when the model supports it).
   *
   * **Asynchronous and billable.** Returns a queued {@link Run}; poll
   * {@link getRun} until `status` is `completed`. The output exposes `model_url`
   * (GLB), `model_urls` (all formats), plus texture/thumbnail/seed. Rigging,
   * animation, and PBR add cost — price the exact config with
   * {@link estimateCost} first.
   */
  create3dModelGeneration(input: Create3dModelRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/models/3d/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Upscaling and background removal ────────────────────────────────────────

  /**
   * Upscale an image 2× or 4× (Topaz). **Billable**; returns a completed
   * {@link Run} synchronously in the common case.
   */
  upscaleImage(input: UpscaleImageRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/images/upscale', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Upscale a video. **Billable** and slow — poll {@link getRun}.
   *
   * Defaults to Topaz at 2×. Pass `model: 'video_upscale.flux_video_upscale'`
   * for the FLUX 3 engine, which accepts a fractional `scale_factor` from 1.5
   * to 3, a `mode`, and an optional guiding `prompt`.
   */
  upscaleVideo(input: UpscaleVideoRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/videos/upscale', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Cut the background out of an image (BRIA). **Billable.** The model is fixed
   * — there is no model choice for this operation.
   */
  removeBackground(input: RemoveBackgroundRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/images/background-remove', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Documents ───────────────────────────────────────────────────────────────

  /** List the HTML documents in the account's Drive. Free. */
  listDocuments(signal?: AbortSignal): Promise<ListResponse<GenFireDocument>> {
    return this.request<ListResponse<GenFireDocument>>('GET', '/documents', { signal });
  }

  /**
   * Author an HTML document (report, page, deck) into the account's Drive and
   * get back a permanent shareable URL. Free. For long documents, create with
   * the opening sections then {@link appendDocument} the rest in chunks.
   */
  createDocument(input: CreateDocumentRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<GenFireDocument> {
    return this.request<GenFireDocument>('POST', '/documents', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Append HTML to the end of an existing document. Free. */
  appendDocument(documentId: string, html: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<DocumentMutationResult> {
    return this.request<DocumentMutationResult>('POST', `/documents/${encodeURIComponent(documentId)}/append`, {
      body: { html },
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Find-and-replace inside a document. Returns the number of `occurrences`
   * replaced — 0 means the `find` string was not present. Free.
   */
  editDocument(documentId: string, find: string, replace: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<DocumentEditResult> {
    return this.request<DocumentEditResult>('POST', `/documents/${encodeURIComponent(documentId)}/edit`, {
      body: { find, replace },
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Skills ──────────────────────────────────────────────────────────────────

  /** List the skills installed in this account. Free. */
  listSkills(signal?: AbortSignal): Promise<ListResponse<Skill>> {
    return this.request<ListResponse<Skill>>('GET', '/skills', { signal });
  }

  /** Browse published marketplace skills (up to 60). Free. */
  listSkillMarket(signal?: AbortSignal): Promise<ListResponse<Skill>> {
    return this.request<ListResponse<Skill>>('GET', '/skills/market', { signal });
  }

  /** Save a skill to the account, optionally publishing it at the same time. Free. */
  createSkill(input: CreateSkillRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<Skill> {
    return this.request<Skill>('POST', '/skills', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Publish (or, with `publish: false`, unpublish) one of your skills. Free. */
  publishSkill(skillId: string, publish = true, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<SkillVisibility> {
    return this.request<SkillVisibility>('POST', `/skills/${encodeURIComponent(skillId)}/publish`, {
      body: { publish },
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Install a published marketplace skill into this account. Free. */
  installSkill(publishedId: string, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<Skill> {
    return this.request<Skill>('POST', `/skills/market/${encodeURIComponent(publishedId)}/install`, {
      body: {},
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Apps and websites ───────────────────────────────────────────────────────

  /**
   * Build an app or website from a prompt. **Asynchronous and billable** —
   * returns a queued {@link Run}; poll {@link getRun} for `app_id` and
   * `live_url`. Pass `app_id` to iterate on an existing build instead of
   * starting a new one.
   */
  createAppGeneration(input: CreateAppGenerationRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/apps/generations', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Deploy HTML you already have — skips generation entirely and hosts the
   * document at a permanent URL. The document is smoke-booted first: a page
   * that throws on load is rejected with `boot_failed` rather than deployed,
   * so retry with a NEW idempotency key after fixing the code.
   */
  deployApp(input: DeployAppRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/apps/deployments', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Publish (or, with `publish: false`, unpublish) a completed app. Free. */
  publishApp(appId: string, publish = true, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<AppVisibility> {
    return this.request<AppVisibility>('POST', `/apps/${encodeURIComponent(appId)}/publish`, {
      body: { publish },
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Social publishing ───────────────────────────────────────────────────────

  /**
   * List connected social accounts. Each entry carries a `target` ref to pass
   * to {@link createSocialPost}. When the list is empty, send the user to
   * `connect_url` to link accounts via OAuth. Free.
   */
  listSocialAccounts(signal?: AbortSignal): Promise<SocialAccountsResponse> {
    return this.request<SocialAccountsResponse>('GET', '/social/accounts', { signal });
  }

  /**
   * Publish or schedule a post to one or more connected accounts. Free (the
   * media it publishes was billed when generated). Omit `scheduled_at` to
   * publish immediately.
   */
  createSocialPost(input: CreateSocialPostRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<SocialPost> {
    return this.request<SocialPost>('POST', '/social/posts', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Read-only access to the allowlisted ScrapeCreators catalog (profiles, posts,
   * transcripts, trends, searches across 27+ platforms). Free.
   *
   * @param path A documented ScrapeCreators path, e.g. '/v1/tiktok/profile'.
   * @param params Extra query parameters forwarded to the upstream endpoint.
   */
  socialLookup(
    path: string,
    params: Record<string, string | number | undefined | null> = {},
    signal?: AbortSignal
  ): Promise<SocialLookupResponse> {
    return this.request<SocialLookupResponse>('GET', '/social/lookup', {
      query: { path, ...params },
      signal
    });
  }

  // ── Ad research ─────────────────────────────────────────────────────────────

  /**
   * Search competitor ad libraries. `days_running` on each result is the
   * performance proxy — 45+ days means the ad is proven. Page with
   * `cursor: <next_cursor>`. Free.
   */
  searchAds(params: SearchAdsParams, signal?: AbortSignal): Promise<SearchAdsResponse> {
    return this.request<SearchAdsResponse>('GET', '/ads/search', {
      query: {
        query: params.query,
        page_id: params.page_id,
        platform: params.platform,
        mode: params.mode,
        limit: params.limit,
        cursor: params.cursor
      },
      signal
    });
  }

  /**
   * Analyze one ad from a {@link searchAds} result and store the reusable
   * format. Pass the returned `research_id` as `reference_ad_research_id` to the
   * `ugc_ad_video` workflow to clone the STRUCTURE for your own product —
   * wording and assets are never copied.
   */
  analyzeAd(input: AnalyzeAdRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<AdResearch> {
    return this.request<AdResearch>('POST', '/ads/analyze', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Re-read a stored ad analysis by its `research_id`. Free. */
  getAdResearch(researchId: string, signal?: AbortSignal): Promise<AdResearch> {
    return this.request<AdResearch>('GET', `/ads/research/${encodeURIComponent(researchId)}`, { signal });
  }

  // ── Media inspection ────────────────────────────────────────────────────────

  /**
   * MEASURE a media file: duration, coded and display dimensions, fps, streams
   * and codecs. Free, synchronous, and not a generation.
   *
   * Reach for it before trimming, composing or lip-syncing: a REQUESTED
   * duration is not a measured one — an 8s video request often lands at 6.4s —
   * and every timing built on the request rather than the measurement is off by
   * that difference. Takes an https URL, an upload `asset_url`, or a past run
   * id. An unreadable source is a 422 `media_unreadable` carrying ffprobe's own
   * reason.
   */
  inspectMedia(input: InspectMediaRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<MediaInspection> {
    return this.request<MediaInspection>('POST', '/media/inspect', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Website captures ────────────────────────────────────────────────────────

  /**
   * Screenshot a LIVE web page in a real headless browser. FREE. Async —
   * returns a queued run; poll {@link waitForRun}, then read
   * `output.shots[].url` along with the capture's provenance (`final_url`
   * after redirects, `captured_at`, the page title).
   *
   * Real pixels, never a stand-in: a page that will not render FAILS the run
   * with a typed code (`capture_unavailable`, `navigation_failed`) rather than
   * handing back something plausible.
   */
  createCapture(input: CreateCaptureRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/captures', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Voice conversion ────────────────────────────────────────────────────────

  /**
   * Re-voice EXISTING audio: keeps the performance — timing, phrasing, pauses,
   * emphasis — and changes only the speaker. It never changes the WORDS; for
   * new wording use {@link createSpeech}, which re-performs them and loses the
   * take. Billed per second of the source, 5-minute cap. Synchronous.
   */
  createVoiceConversion(input: CreateVoiceConversionRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/audio/voice-conversions', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Compose ─────────────────────────────────────────────────────────────────

  /**
   * Cut clips you have already generated into ONE finished video — the
   * assembly step, and the only call that concatenates media. FREE: nothing
   * generates, and the clips were billed when they were made.
   *
   * Two ways to place audio, and they compose. PER CLIP (`clips[].audio_url`)
   * is the line that belongs to a scene: it moves with that scene through
   * every trim and crossfade, so you never compute an offset. ABSOLUTE
   * (`audio[]`) pins a track to the finished timeline — narration spanning
   * scenes, a music bed at `volume: 0.15, loop: true`, a stinger on a beat.
   *
   * Captions are free and burned on. By default the words are TRANSCRIBED from
   * the cut's own audio — a guess at what was said. If you wrote the lines,
   * pass `captions.text` and the server force-aligns your transcript, so the
   * screen carries the exact wording; pass `captions.words` instead when you
   * already hold timings. The two are mutually exclusive and both are part of
   * the request fingerprint, so changing either renders a new cut.
   *
   * Async — poll {@link waitForRun}. `output.clips` reports where each scene
   * actually LANDED after trims, holds and crossfades.
   */
  composeVideo(input: ComposeVideoRequest, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', '/videos/compose', {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Timelines ───────────────────────────────────────────────────────────────

  /**
   * Store a re-renderable EDIT — the half {@link composeVideo} does not have.
   * compose assembles clips end to end and has no vocabulary for two things on
   * screen at once; a timeline says "this logo sits at 62% width, 8% height, at
   * 40% scale, rotated 3°, from 2.0s to 6.5s, above the footage", stores it,
   * and lets you patch and render it again.
   *
   * `sources[]` names each piece of media once and is stored as the REF, not a
   * resolved URL — a signed upload link expires and a run's output URL is
   * re-minted, so a render months later re-resolves rather than 403ing. Every
   * source is probed BEFORE the timeline exists: an unreadable one is a 422
   * `media_unreadable` naming the first clip that depends on it, not a render
   * that dies three minutes in. FREE.
   */
  createTimeline(input: CreateTimelineRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<Timeline> {
    return this.request<Timeline>('POST', '/videos/timelines', {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Read a stored timeline: its full manifest and its current `rev`. Call this
   * before {@link updateTimeline} — the rev is the optimistic-concurrency
   * token, and a patch without the current one is refused rather than quietly
   * overwriting another agent's edit.
   */
  getTimeline(timelineId: string, signal?: AbortSignal): Promise<Timeline> {
    return this.request<Timeline>('GET', `/videos/timelines/${encodeURIComponent(timelineId)}`, { signal });
  }

  /**
   * Replace a timeline's manifest. This is a WHOLE-manifest replace, not a
   * merge: a partial clip list is ambiguous the moment clips are reordered or
   * removed, and you already hold the whole manifest from the read that told
   * you the rev. So {@link getTimeline}, change what you need, send it back.
   *
   * `rev` is required — it travels as `If-Match`. Omitting it is a 428; a stale
   * one is a 409 (re-read and re-apply). Sources are re-probed. Free.
   */
  updateTimeline(timelineId: string, input: UpdateTimelineRequest, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<Timeline> {
    const { rev, ...manifest } = input;
    return this.request<Timeline>('PATCH', `/videos/timelines/${encodeURIComponent(timelineId)}`, {
      body: { ...manifest, rev },
      signal: options.signal,
      headers: { 'If-Match': String(rev), ...(options.headers || {}) }
    });
  }

  /**
   * Render a revision. `preview` (the default) is the SAME compositor at 480p
   * on the short edge — an honest proxy for the final, not a second renderer
   * that can disagree with it — and its bytes are cached by manifest content,
   * so looking at an unchanged revision twice costs one pass and the second
   * run reports `output.cached`. FREE either way.
   *
   * Renders are runs keyed on the revision, so re-rendering an unchanged one
   * dedupes onto the earlier run and a patched manifest is a new one. The
   * render inherits the timeline's project and workspace; neither is named
   * here. Async — poll {@link waitForRun}.
   */
  renderTimeline(timelineId: string, input: RenderTimelineRequest = {}, options: RequestOptions = {}): Promise<Run> {
    return this.request<Run>('POST', `/videos/timelines/${encodeURIComponent(timelineId)}/renders`, {
      body: input,
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
      headers: options.headers
    });
  }

  /** Every render of one timeline, newest first, each carrying its `rev` and mode. */
  listTimelineRenders(timelineId: string, params: { limit?: number } = {}, signal?: AbortSignal): Promise<ListResponse<Run>> {
    return this.request<ListResponse<Run>>('GET', `/videos/timelines/${encodeURIComponent(timelineId)}/renders`, {
      query: { limit: params.limit },
      signal
    });
  }

  // ── Presets ─────────────────────────────────────────────────────────────────

  /**
   * The published preset library: ready-made multi-step pipelines, runnable by
   * name. Free. Reach for one before assembling the same chain by hand.
   */
  listPresets(signal?: AbortSignal): Promise<ListResponse<Preset>> {
    return this.request<ListResponse<Preset>>('GET', '/presets', { signal });
  }

  /**
   * One preset in full: the flat `inputs[]` list {@link runPreset}'s `inputs`
   * is built from, the cost at defaults, and the unlock price if it is paid.
   * Build the inputs object from THIS — an unknown key is a 400 that names it,
   * and an ambiguous one wants the full `"<node_id>.<param>"` form.
   */
  getPreset(presetId: string, signal?: AbortSignal): Promise<Preset> {
    return this.request<Preset>('GET', `/presets/${encodeURIComponent(presetId)}`, { signal });
  }

  /**
   * Price a published preset BEFORE running it — the exact number
   * {@link runPreset} will charge, from the same estimator the run uses, with
   * a per-node breakdown. Free, and it creates nothing: no copy of the preset
   * is instantiated and no credits are held, so a caller who has never run
   * this preset is quoted the same as one who has run it ten times.
   *
   * Returns a `quote_token` and the `preset_rev` it priced. Pass the token to
   * {@link runPreset} to be charged the number the user was shown; if the
   * inputs or the preset's own revision moved in between, the run answers 409
   * `quote_mismatch` carrying a fresh quote rather than a surprise price.
   *
   * A PAID preset answers 402 `preset_purchase_required` here too — a quote is
   * never issued for a preset the caller could not actually run. Unlocking is
   * a WRITE, so there is no `confirm_purchase` on this call; it belongs on
   * {@link runPreset}.
   */
  estimatePreset(presetId: string, input: EstimatePresetRequest = {}, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<PresetCostEstimate> {
    return this.request<PresetCostEstimate>('POST', `/presets/${encodeURIComponent(presetId)}/estimate`, {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Run a published preset with your own inputs.
   *
   * Async, and NOT on {@link waitForRun}: a preset run is a CANVAS run, filed
   * under the copy this call instantiates. Poll
   * {@link getUserWorkflowRun} with the `workflowId` AND `runId` the 202
   * carries — {@link getRun} reads the flat run collection and answers 404
   * `run_not_found` for it.
   *
   * A PAID preset bills twice over: the first call returns 402
   * `preset_purchase_required` carrying the unlock price, and you retry with
   * `confirm_purchase: true`. That unlock is ONE TIME — later runs are free of
   * it. Running a preset never touches the author's published graph: your own
   * copy is instantiated once and reused.
   *
   * Price it with {@link estimatePreset} first and pass that call's
   * `quote_token`, so the user is charged the number they were shown.
   */
  runPreset(presetId: string, input: RunPresetRequest = {}, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<PresetRun> {
    return this.request<PresetRun>('POST', `/presets/${encodeURIComponent(presetId)}/runs`, {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  // ── Canvas workflows ────────────────────────────────────────────────────────

  /**
   * Price one of the account's OWN canvas workflows without running it. Free,
   * creates nothing, charges nothing.
   *
   * The number comes from the same estimator the run itself calls, so a quote
   * and the run that follows cannot disagree. The breakdown is per node and
   * marks the ones already `cached` (free to re-run). Returns a `quote_token`
   * to pass back on the submit, and the `workflow_rev` it priced — an edit to
   * the canvas between quote and run is then caught rather than silently
   * repriced.
   */
  estimateUserWorkflow(workflowId: string, input: EstimateUserWorkflowRequest = {}, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<WorkflowCostEstimate> {
    return this.request<WorkflowCostEstimate>('POST', `/user-workflows/${encodeURIComponent(workflowId)}/estimate`, {
      body: input,
      signal: options.signal,
      headers: options.headers
    });
  }

  /**
   * Run one of the account's OWN canvas workflows — the submit half of
   * {@link estimateUserWorkflow}. BILLS CREDITS.
   *
   * Quote it first, show the user the number, then pass that quote's
   * `quote_token` here so they are charged what they agreed to rather than the
   * live price. The whole page runs unless `selected_node_ids` narrows it to
   * those nodes and their dependencies — the way to redo one branch without
   * re-paying for the rest. Nodes whose inputs have not changed are cached and
   * cost nothing either way; the estimate marks them.
   *
   * Async: the 202 carries `runId` and `totalCostCredits`, and this method
   * echoes the `workflowId` onto it. Poll {@link getUserWorkflowRun} with both
   * — a canvas run is addressed under its workflow, so {@link getRun} reads the
   * flat run collection and answers 404 `run_not_found` for it.
   *
   * NOT {@link runWorkflow}, which runs a PUBLISHED workflow by key. Same noun
   * to a user, two collections underneath.
   */
  async runUserWorkflow(workflowId: string, input: RunUserWorkflowRequest = {}, options: Omit<RequestOptions, 'idempotencyKey'> = {}): Promise<UserWorkflowRun> {
    const run = await this.request<Omit<UserWorkflowRun, 'workflowId'> & { workflowId?: string }>(
      'POST',
      `/user-workflows/${encodeURIComponent(workflowId)}/runs`,
      {
        body: input,
        signal: options.signal,
        headers: options.headers
      }
    );
    // The 202 does not carry the workflow id — but the run cannot be READ
    // without it (a canvas run is addressed under its workflow), so a caller
    // handed only this object would have nothing to poll with. Echoed from the
    // argument, and a server-supplied value wins if the route ever adds one.
    return { workflowId, ...run };
  }

  /**
   * One canvas run node by node: every executed node with its own status,
   * error and output, the `workflowRev` that ran, and the results split into
   * `deliverables` and `intermediates`. Free.
   *
   * A run is addressed UNDER its workflow, so both ids are required — the
   * workflow read is also the access gate.
   */
  getUserWorkflowRun(workflowId: string, runId: string, signal?: AbortSignal): Promise<UserWorkflowRunStatus> {
    return this.request<UserWorkflowRunStatus>(
      'GET',
      `/user-workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}`,
      { signal }
    );
  }

  // ── Usage ───────────────────────────────────────────────────────────────────

  /**
   * Credit spend and run counts over a date range, grouped by model (default),
   * capability, or day. Defaults to the last 30 days. Free.
   */
  getUsage(params: GetUsageParams = {}, signal?: AbortSignal): Promise<UsageSummary> {
    return this.request<UsageSummary>('GET', '/usage', {
      query: {
        start_date: params.start_date,
        end_date: params.end_date,
        group_by: params.group_by,
        capability: params.capability,
        team_id: params.team_id
      },
      signal
    });
  }
}
