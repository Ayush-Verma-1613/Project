import { createApp } from './app.js';
import { config } from './config.js';
import { store } from './store/index.js';

const app = createApp();
let initialization;

function initializeStore() {
  initialization ??= store.init();
  return initialization;
}

/** Vercel invokes this handler for each API request. */
export default async function handler(req, res) {
  try {
    await initializeStore();
    return app(req, res);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return res.status(500).json({ message: 'Database connection failed.' });
  }
}

async function bootstrap() {
  await initializeStore();
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
    console.log(
      store.name === 'mongo'
        ? 'Persistence: mongo (data is stored in MongoDB)'
        : 'Persistence: memory (data resets when the server restarts)',
    );
  });
}

if (!process.env.VERCEL) {
  bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
