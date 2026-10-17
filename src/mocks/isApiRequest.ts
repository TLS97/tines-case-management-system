import type { UnhandledFrameHandle } from 'msw';

export const API_PREFIX = '/api/';

// MSW does not export the callback type, only the union of strategy names and the callback.
type UnhandledFrameCallback = Exclude<UnhandledFrameHandle, string>;
type Frame = Parameters<UnhandledFrameCallback>[0]['frame'];

// MSW 3 reports unhandled "frames" for every protocol; for HTTP the frame data holds the Request.
// Only calls to our own API matter: an unhandled one is a bug. App files, fonts and Vite's
// own requests also pass through the worker and must be ignored.
export function isUnhandledApiRequest(frame: Frame): boolean {
  if (frame.protocol !== 'http') return false;
  const { data } = frame;
  if (typeof data !== 'object' || data === null || !('request' in data)) return false;
  const { request } = data;
  return request instanceof Request && new URL(request.url).pathname.startsWith(API_PREFIX);
}
