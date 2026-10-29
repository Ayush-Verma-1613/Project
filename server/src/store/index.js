import { config } from '../config.js';
import { memoryStore } from './memoryStore.js';
import { mongoStore } from './mongoStore.js';

/**
 * Persistence selector.
 *
 * PERSISTENCE=memory  -> in-memory store (default, used for this assessment)
 * PERSISTENCE=mongo   -> MongoDB Atlas or a local MongoDB instance.
 */
export function createStore() {
  if (config.persistence === 'mongo') {
    return mongoStore;
  }
  return memoryStore;
}

export const store = createStore();
