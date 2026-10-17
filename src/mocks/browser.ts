import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { isUnhandledApiRequest } from './isApiRequest';

const worker = setupWorker(...handlers);

/** Starts the mock API in the browser. The app must wait for this before its first request. */
export async function startMockApi(): Promise<void> {
  await worker.start({
    // Request logging would print case and personal data to the console (security.md).
    quiet: true,
    onUnhandledFrame({ frame, defaults }) {
      if (isUnhandledApiRequest(frame)) defaults.error();
    },
  });
}
