# Genfire TypeScript SDK

Typed fetch-based client for the Genfire Public API.

## Install

```bash
npm install @genfire/sdk
```

Node 18+ is recommended. In browsers and modern runtimes, the SDK uses the global `fetch`. In older Node runtimes or custom runtimes, pass a `fetch` implementation when creating the client.

## API Key Usage

```ts
import { GenFireClient } from '@genfire/sdk';

const client = new GenFireClient({
  apiKey: process.env.GENFIRE_API_KEY!,
});

const models = await client.listModels();
console.log(models.data.map((model) => model.id));
```

## OAuth Client Credentials

```ts
import { GenFireClient, createOAuthAccessToken } from '@genfire/sdk';

const token = await createOAuthAccessToken({
  clientId: process.env.GENFIRE_CLIENT_ID!,
  clientSecret: process.env.GENFIRE_CLIENT_SECRET!,
  scope: 'models:read runs:read images:write',
});

const client = new GenFireClient({
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
    model: 'video.veo_3_1',
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
