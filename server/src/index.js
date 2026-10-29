import { createApp } from './app.js';
import { config } from './config.js';
import { store } from './store/index.js';

async function bootstrap() {
  await store.init();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
    console.log(
      store.name === 'mongo'
        ? 'Persistence: mongo (data is stored in MongoDB)'
        : 'Persistence: memory (data resets when the server restarts)',
    );
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
