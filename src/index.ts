import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { createModGuardApp } from './serverApp';

const app = createModGuardApp();

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
