import { vi } from 'vitest';

// EventSource is not available in happy-dom; provide a no-op stub.
if (typeof globalThis.EventSource === 'undefined') {
  const MockEventSource = vi.fn().mockImplementation(() => ({
    onmessage: null,
    onopen: null,
    onerror: null,
    close: vi.fn(),
  }));
  // @ts-expect-error — assigning to read-only global in test env
  globalThis.EventSource = MockEventSource;
}
