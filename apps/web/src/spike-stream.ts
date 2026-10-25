const encoder = new TextEncoder();

export function parseStreamCount(url: URL): number | null {
  if ([...url.searchParams.keys()].some((key) => key !== 'count')) return null;
  if (url.searchParams.getAll('count').length > 1) return null;
  const value = url.searchParams.get('count') ?? '3';
  return /^[1-5]$/.test(value) ? Number(value) : null;
}

export function createSpikeStream(
  signal: AbortSignal,
  count: number,
  intervalMs = 75,
): ReadableStream<Uint8Array> {
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new RangeError('Stream count must be between 1 and 5');
  }
  if (!Number.isInteger(intervalMs) || intervalMs < 1 || intervalMs > 1000) {
    throw new RangeError('Stream interval must be between 1 and 1000 ms');
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const cleanup = () => {
    closed = true;
    if (timer !== undefined) clearInterval(timer);
    signal.removeEventListener('abort', finish);
  };
  const finish = () => {
    if (closed) return;
    cleanup();
    controller.close();
  };
  const emit = (event: string, data: Record<string, number>) => {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    );
  };

  return new ReadableStream<Uint8Array>({
    start(output) {
      controller = output;
      if (signal.aborted) {
        finish();
        return;
      }
      emit('ready', { count });
      signal.addEventListener('abort', finish, { once: true });
      let index = 0;
      timer = setInterval(() => {
        if (closed) return;
        emit('item', { index: ++index });
        if (index === count) {
          emit('done', { count });
          finish();
        }
      }, intervalMs);
    },
    cancel() {
      cleanup();
    },
  });
}
