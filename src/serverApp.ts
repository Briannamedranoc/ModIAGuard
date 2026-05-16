import { Hono } from 'hono';
import { autoModerationRouter } from './routes/autoModeration';
import { autoResponderRouter } from './routes/autoResponder';
import { demoRouter } from './routes/demo';
import { moderationsRouter } from './routes/moderations';
import { aiRouter } from './routes/ai';
import { api } from './routes/api';
import { logsRouter } from './routes/logs';
import { reportActionsRouter } from './routes/reportActions';
import { reportsRouter } from './routes/reports';
import { spamRouter } from './routes/spam';
import { toxicityRouter } from './routes/toxicity';
import { forms } from './routes/forms';
import { dashboard } from './routes/dashboard';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';

/** Servidor Devvit Web (menús HTTP, formularios, triggers). */
export function createModGuardApp(): Hono {
  const app = new Hono();
  const internal = new Hono();

  internal.route('/menu', menu);
  internal.route('/menu', dashboard);
  internal.route('/form', forms);
  internal.route('/triggers', triggers);

  app.route('/api', api);
  app.route('/api/toxicity', toxicityRouter);
  app.route('/api/spam', spamRouter);
  app.route('/api/reports', reportsRouter);
  app.route('/api/report-actions', reportActionsRouter);
  app.route('/api/logs', logsRouter);
  app.route('/api/ai', aiRouter);
  app.route('/api/auto-responder', autoResponderRouter);
  app.route('/api/moderations', moderationsRouter);
  app.route('/api/auto-moderation', autoModerationRouter);
  app.route('/api/demo', demoRouter);
  app.route('/internal', internal);

  return app;
}
