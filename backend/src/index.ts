import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { loadConfig } from './infrastructure/config';
import { buildRouter } from './adapters/http/routes';
import { AppError } from './domain/errors/AppError';

const config = loadConfig();

const app = express();

// Sets X-Content-Type-Options, X-Frame-Options, HSTS, etc.
app.use(helmet());

app.use(express.json({ limit: '10kb' }));

// Restrict CORS to configured origin — never use * in production
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// 120 req/min per IP — generous for a dashboard, firm enough to block scraping
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Slow down.' },
  }),
);

app.use('/', buildRouter());

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error middleware: AppError gets its status code; everything else becomes a 500.
// Stack traces never reach the client — only logged server-side.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`[olist-api] :${config.port} | env: ${config.nodeEnv}`);
});

export { app };
