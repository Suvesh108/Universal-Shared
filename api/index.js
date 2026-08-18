import express from 'express';
import cors from 'cors';
import { initDb } from '../backend/src/db.js';
import { createApiRouter } from '../backend/src/routes/api.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Ensure database is initialized
app.use(async (_req, _res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('Failed to initialize database in serverless function:', err);
    next();
  }
});

const apiRouter = createApiRouter();

// Mount on /api first, then fallback to root
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global JSON error handler
app.use((err, _req, res, _next) => {
  console.error('Serverless API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
