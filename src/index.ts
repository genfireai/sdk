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
  | 'uploads:write'
  | 'influencers:read'
  | 'influencers:write'
  | 'elements:read'
  | 'elements:write';

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

export interface CostEstimate {
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
  /** Single source image to edit. Use `image_urls` for multi-image edits. */
  image_url?: string;
  /**
   * Up to 14 source image URLs for a multi-image edit. Supported by
   * image.gpt_image_2, Seedream, Qwen Image 2 and the Nano Banana family;
   * Grok uses at most the first 3. Routes through the model's edit variant.
   */
  image_urls?: string[];
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

export interface CreateInfluencerOptions {
  /** Short @-mention handle (letters, digits, underscores), e.g. `maya`. Lowercased; unique per account. */
  handle: string;
  /** 1–8 absolute https URLs of reference photos. At least one should show a clear, front-facing face. */
  photoUrls: string[];
  /** Human-friendly name shown in the influencer list. Defaults to `handle`. */
  displayName?: string;
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
  /** Codegen model alias (e.g. `claude-opus-4-8`). Defaults to Opus. */
  model?: string;
  /** Up to 16 asset URLs (images / GLB / audio) to wire into the game. */
  asset_urls?: string[];
  /** Build with realtime multiplayer via the GenFire relay. */
  multiplayer?: boolean;
}

export interface PublishGameResponse {
  id: string;
  object: 'game';
  is_public: boolean;
}

export interface CreateVideoGenerationRequest {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  duration?: number;
  /** Output resolution (e.g. '480p', '720p', '1080p', '4k'). Supported values and pricing are per-model — see `resolutions` in the model's `limits` from `listModels()`. Higher resolutions cost more credits. */
  resolution?: string;
  image_url?: string;
  generate_audio?: boolean;
  /** Output encoding bitrate for Seedance 2.0: 'standard' or 'high'. 'high' requests a larger, higher-quality encode at no extra credit cost. */
  bitrate_mode?: 'standard' | 'high';
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
  /**
   * Voice id. Required for ElevenLabs models (stock voice id or a cloned
   * `fal_cloned_<id>`). For `speech.seed_audio_1_0` it is OPTIONAL and takes a
   * Seed preset name (e.g. `vivi_mixed_en_zh_ja_es_id`) instead.
   */
  voice_id?: string;
  model?: string;
  voice_name?: string;
  /** For `speech.seed_audio_1_0`: one of `wav`, `mp3`, `pcm`, `ogg_opus`. */
  output_format?: string;
  /** Up to 3 reference audio URLs, referenced in `text` as @Audio1–@Audio3. Seed Audio 1.0 only; not with image_url. */
  audio_urls?: string[];
  /** Single reference image URL. Seed Audio 1.0 only; not with audio_urls. */
  image_url?: string;
  /** Output sample rate in Hz (8000/16000/24000/32000/44100/48000). Seed Audio 1.0 only. */
  sample_rate?: number;
  /** Speech speed 0.5–2. Seed Audio 1.0 only. */
  speed?: number;
  /** Volume 0.5–2. Seed Audio 1.0 only. */
  volume?: number;
  /** Pitch shift in semitones, -12..12. Seed Audio 1.0 only. */
  pitch?: number;
}

export interface CreateMusicRequest {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  include_details?: boolean;
  with_timestamps?: boolean;
  force_instrumental?: boolean;
  output_format?: string;
  /** Image URL used as inspiration for the generated music. Lyria 3 Pro only. */
  image_url?: string;
  /** Description of what to exclude from the generated audio. Lyria 3 Pro only. */
  negative_prompt?: string;
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

export interface CreateFacelessReelRequest {
  /** Subject/seed for the reel. Use a phrase or "Surprise me with a fresh idea". */
  topic: string;
  /** Niche preset id — see {@link GenFireClient.listFacelessReelPresets}. */
  preset_id?: string;
  /** Visual style id — see {@link GenFireClient.listFacelessReelStyles}. Defaults to the preset's recommended style. */
  style_id?: string;
  /** Target length in seconds (10–120). Drives script + scene count. */
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

export interface FacelessReelSubscriptionInput {
  label?: string;
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
  label?: string;
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
 *  Passing one bypasses GenFire's internal LLM entirely — you author the whole
 *  creative contract and GenFire is pure rendering. */
export interface ExplainerScript {
  /** Recurring characters (up to 3). */
  cast?: ExplainerScriptCastMember[];
  /** Ordered beats (3–100). Total narration length sets the film's runtime. */
  beats: ExplainerScriptBeat[];
}

export interface CreateExplainerRequest {
  /** What the explainer is about. Required even alongside a script (titling/metadata). */
  topic: string;
  /** Structured agent-authored script. When present, GenFire makes ZERO
   *  internal LLM calls (no script writing, no storyboarding) — it renders
   *  your beats verbatim, and the narration length sets the duration
   *  (`target_duration_sec` is ignored). */
  script?: ExplainerScript;
  /** Plain-text script narrated verbatim; GenFire still storyboards the visuals. */
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
   * Create a reusable influencer character from 1–8 reference photos. The bytes
   * are copied into durable storage and a character reference sheet is generated
   * to lock the identity, after which the influencer is returned in `ready`
   * status — immediately usable via `mentions` in image generation.
   *
   * This is a synchronous, **billable** call (sheet generation) that typically
   * takes 30–60 seconds. `photo_urls` must be absolute https URLs; upload local
   * files with `uploadFile()` first and pass the returned `asset_url`s.
   */
  createInfluencer(options: CreateInfluencerOptions): Promise<Influencer> {
    return this.request<Influencer>('POST', '/influencers', {
      body: {
        handle: options.handle,
        display_name: options.displayName,
        photo_urls: options.photoUrls
      },
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
   * Publish a completed game you own to the public GenFire games gallery
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
   * Pass a structured `script` to author every beat yourself — GenFire then
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
