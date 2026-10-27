export class BodyLimitError extends RangeError {}

/** Shared transport bound; cancel on overflow, read failure or request abort. */
export async function readBoundedBody(
  stream: ReadableStream<Uint8Array>,
  limit: number,
  signal?: AbortSignal | null,
) {
  const reader = stream.getReader();
  const bytes = new Uint8Array(limit);
  let size = 0;
  let complete = false;
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    signal?.throwIfAborted();
    for (;;) {
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      if (value.byteLength > limit - size)
        throw new BodyLimitError('Response exceeds its byte budget.');
      bytes.set(value, size);
      size += value.byteLength;
    }
    complete = true;
    return bytes.subarray(0, size);
  } finally {
    signal?.removeEventListener('abort', abort);
    if (!complete) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
