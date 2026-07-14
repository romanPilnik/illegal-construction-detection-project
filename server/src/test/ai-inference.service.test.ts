import { afterEach, describe, expect, it, jest } from '@jest/globals';

const originalFetch = global.fetch;

/** Mimics fetch that hangs until AbortSignal fires (like a slow AI inference call). */
const createHangingFetchMock = () =>
  jest.fn((_url: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) {
        return;
      }
      if (signal.aborted) {
        reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }));
        return;
      }
      signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }));
      });
    });
  });

describe('requestAIInference', () => {
  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    delete process.env.AI_SERVICE_TIMEOUT_MS;
    delete process.env.AI_SERVICE_URL;
    delete process.env.AI_SERVICE_API_KEY;
    jest.resetModules();
  });

  it('throws a clear error when the AI HTTP call exceeds AI_SERVICE_TIMEOUT_MS', async () => {
    jest.useFakeTimers();

    process.env.AI_SERVICE_TIMEOUT_MS = '60';
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9/predict';

    global.fetch = createHangingFetchMock();

    const { requestAIInference } = await import(
      '../services/ai-inference.service.js'
    );

    const inferencePromise = requestAIInference(
      Buffer.from('x'),
      Buffer.from('y'),
      'before.png',
      'after.png'
    );

    const assertion = expect(inferencePromise).rejects.toThrow(
      /AI service request timed out after 60ms/
    );

    await jest.advanceTimersByTimeAsync(60);

    await assertion;
  });

  it('resolves when fetch returns quickly', async () => {
    process.env.AI_SERVICE_TIMEOUT_MS = '5000';
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9/predict';

    global.fetch = jest.fn(async () => {
      return new Response(
        JSON.stringify({
          anomalyDetected: false,
          coordinates: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const { requestAIInference } = await import(
      '../services/ai-inference.service.js'
    );

    const out = await requestAIInference(
      Buffer.from('x'),
      Buffer.from('y'),
      'before.png',
      'after.png'
    );

    expect(out.anomalyDetected).toBe(false);
    expect(out.coordinates).toBeNull();
  });

  it.each([
    {},
    { anomalyDetected: 'false', coordinates: [] },
    { anomalyDetected: true, coordinates: [{ x: 1 }] },
  ])('rejects a malformed successful response: %p', async (payload) => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { requestAIInference } = await import(
      '../services/ai-inference.service.js'
    );

    await expect(
      requestAIInference(
        Buffer.from('x'),
        Buffer.from('y'),
        'before.png',
        'after.png'
      )
    ).rejects.toThrow(/AI service returned (an )?invalid/);
  });
});
