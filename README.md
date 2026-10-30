# Genfire TypeScript SDK

Typed fetch-based client for the Genfire Public API.

## Install

```bash
npm install @genfire/sdk
```

Node 18+ is recommended. In browsers and modern runtimes, the SDK uses the global `fetch`. In older Node runtimes or custom runtimes, pass a `fetch` implementation when creating the client.

## API Key Usage

```ts
import { GenfireClient } from '@genfire/sdk';

const client = new GenfireClient({
  apiKey: process.env.GENFIRE_API_KEY!,
});

const models = await client.listModels();
console.log(models.data.map((model) => model.id));
```

## OAuth Client Credentials

```ts
import { GenfireClient, createOAuthAccessToken } from '@genfire/sdk';

const token = await createOAuthAccessToken({
  clientId: process.env.GENFIRE_CLIENT_ID!,
  clientSecret: process.env.GENFIRE_CLIENT_SECRET!,
  scope: 'models:read runs:read images:write',
});

const client = new GenfireClient({
  accessToken: token.access_token,
});
```

## Image Generation

```ts
const run = await client.createImageGeneration(
  {
    prompt: 'Studio product photo of a premium coffee bag on dark stone',
    model: 'image.nano_banana_2',
    aspect_ratio: '1:1',
    count: 1,
  },
  {
    idempotencyKey: 'img_demo_001',
  }
);

console.log(run.status, run.output);
```

## Video Generation And Polling

```ts
const queuedRun = await client.createVideoGeneration(
  {
    prompt: 'Cinematic close-up of a luxury watch with soft lighting',
    model: 'video.kling_v4',
    aspect_ratio: '16:9',
    duration: 8,
  },
  {
    idempotencyKey: 'video_demo_001',
  }
);

const finalRun = await client.waitForRun(queuedRun.id, {
  intervalMs: 5000,
  timeoutMs: 10 * 60 * 1000,
});

console.log(finalRun.status, finalRun.output);
```

## Workflows

```ts
const run = await client.runWorkflow(
  'hook_pack',
  {
    prompt: 'Portable blender for busy professionals',
    audience: 'Remote workers who skip breakfast',
    tone: 'persuasive',
    length: 'short',
  },
  {
    idempotencyKey: 'hook_pack_demo_001',
  }
);
```

## Batches

```ts
const batch = await client.createBatch(
  {
    mode: 'workflow',
    target: 'hook_pack',
    concurrency: 2,
    items: [
      { input: { prompt: 'Portable blender for busy professionals' } },
      { input: { prompt: 'Portable blender for college students' } },
    ],
  },
  {
    idempotencyKey: 'batch_demo_001',
  }
);
```

## Webhooks

```ts
const webhook = await client.createWebhook({
  url: 'https://example.com/webhooks/genfire',
  description: 'Agency production endpoint',
  events: ['run.completed', 'run.failed'],
});

console.log(webhook.signing_secret);
```

Verify deliveries with either signature scheme (Standard Webhooks `webhook-*`
headers, or the original `X-Genfire-Signature`) — pass the RAW body:

```ts
import { verifyWebhook, WebhookVerificationError } from '@genfire/sdk';

app.post('/webhooks/genfire', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = await verifyWebhook(req.body, req.headers, process.env.GENFIRE_WEBHOOK_SECRET!);
    // event.type === 'run.completed' | 'run.failed' …
    res.sendStatus(200);
  } catch (err) {
    if (err instanceof WebhookVerificationError) return res.sendStatus(400);
    throw err;
  }
});
```

Standard Webhooks libraries work too: use `webhook.signing_secret_standard`
(or `toStandardWebhooksSecret(signing_secret)`).

## Cancel, delete and exports

```ts
await client.cancelRun(run.id);            // refunds reserved credits; run ends failed / error.code "cancelled"
await client.deleteRun(run.id);            // removes the run and its output files

// Final Cut Pro / Premiere / Resolve / Avid project files + media (free)
const bundle = await client.waitForRun((await client.createTimelineExport(timelineId)).id);
console.log(bundle.output?.url);

// ProRes 422 HQ, DNxHR HQ, WAV 48k/24-bit, PNG/TIFF sequences, layered PSD (free)
const master = await client.waitForRun((await client.createExport({ format: 'prores_422_hq', run_id: run.id })).id);
console.log(master.output?.url);
```

Every 429 carries `Retry-After`; the SDK exposes it as `error.retryAfterSeconds`.

## Notes

- Set `baseUrl` if you need to target a non-default environment.
- Pass a custom `fetch` implementation if your runtime does not provide global `fetch`.
- Mutating generation, workflow, batch, and product extraction endpoints require `idempotencyKey`.
- Use the public docs for endpoint behavior and examples:
  - `https://api.genfire.ai/v1/docs`
  - `https://api.genfire.ai/v1/openapi.json`

## Publishing

From `sdk/typescript`:

```bash
npm run typecheck
npm pack --dry-run
npm publish --access public
```
