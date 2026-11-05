const USER_AGENT = "churrasco-do-daniel/1.0";

/**
 * Workers allow 6 simultaneous outgoing connections per request.
 * This gate is created once per page render so two visitors do not share a counter.
 */
export type FetchGate = {
  run<T>(task: () => Promise<T>): Promise<T>;
};

export function createFetchGate(max = 4): FetchGate {
  let active = 0;
  const waiters: Array<() => void> = [];
  return {
    async run(task) {
      if (active >= max) {
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
        });
      }
      active += 1;
      try {
        return await task();
      } finally {
        active -= 1;
        const next = waiters.shift();
        next?.();
      }
    },
  };
}

async function request(url: string, accept: string, timeoutMs: number, gate?: FetchGate): Promise<Response> {
  const run = () =>
    fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept,
        "user-agent": USER_AGENT,
      },
    });
  const response = gate ? await gate.run(run) : await run();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response;
}

export async function fetchJson<T>(url: string, timeoutMs = 8000, gate?: FetchGate): Promise<T> {
  const response = await request(url, "application/json", timeoutMs, gate);
  return (await response.json()) as T;
}

export async function fetchText(url: string, timeoutMs = 8000, gate?: FetchGate): Promise<string> {
  const response = await request(
    url,
    "application/rss+xml, application/xml, text/xml, */*",
    timeoutMs,
    gate,
  );
  return response.text();
}
