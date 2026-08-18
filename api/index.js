import express from 'express';
import cors from 'cors';
import { initDb } from '../backend/src/db.js';
import { createApiRouter } from '../backend/src/routes/api.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Ensure SQLite database is initialized
app.use(async (_req, _res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('Failed to initialize database in serverless function:', err);
    next(err);
  }
});

const apiRouter = createApiRouter();

// Mount on both /api and root to handle any Vercel rewrite configuration
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
