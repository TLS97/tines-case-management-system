import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { mockServer } from '@/mocks/node';

// jsdom does not implement <dialog> yet; this is just enough for open/close in component tests.
// Real browser behaviour is covered by the e2e tests.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
}
if (typeof HTMLDialogElement.prototype.close !== 'function') {
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom has no Web Animations API; Designsystemet's Spinner uses it to keep spinners in sync.
if (typeof document.getAnimations !== 'function') {
  document.getAnimations = () => [];
}

// Tests use the same MSW mock API as the app (docs/conventions/testing.md).
// Any request to a path without a handler fails the test.
beforeAll(() => {
  mockServer.listen({ onUnhandledFrame: 'error' });
});

// Like the e2e console check: a test fails if anything logs a console error it did not expect
// (React key and prop warnings, failed renders). A test that expects errors silences them itself
// with vi.spyOn(console, 'error').mockImplementation(() => {}).
let consoleErrors: string[] = [];

// Every test starts from the seed data.
beforeEach(() => {
  localStorage.clear();
  consoleErrors = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  const errors = consoleErrors;
  consoleErrors = [];
  if (errors.length > 0) {
    throw new Error(`Unexpected console.error during the test:\n${errors.join('\n')}`);
  }
});

afterEach(() => {
  // Testing Library only cleans up automatically when test globals are enabled; they are not.
  cleanup();
  mockServer.resetHandlers();
});

afterAll(() => {
  mockServer.close();
});
