import { app, initializeStore } from './app.js';
import { config } from './config.js';
import { store } from './store/index.js';

// Kept as an entry point for local Node.js development.
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
