import { createApp } from './app.js';
import { config } from './config.js';
import { store } from './store/index.js';

let initialization;

function initializeStore() {
  initialization ??= store.init();
  return initialization;
}

const app = createApp({ initialize: initializeStore });

// Vercel recognizes this as the Express application for its serverless function.
export default app;

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
