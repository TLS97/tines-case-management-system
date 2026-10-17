import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** The same mock API for Vitest (started in src/test/setup.ts). */
export const mockServer = setupServer(...handlers);
