/**
 * MSW server setup for testing HaloPSA API calls.
 */

import { setupServer } from 'msw/node';
import { haloHandlers } from './handlers';

export const server = setupServer(...haloHandlers);
