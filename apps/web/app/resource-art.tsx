'use client';
import { useEffect, useRef, useState } from 'react';
import type { WebResource } from '../src/catalog';

/** Only the validated versioned same-origin key; never a provider thumbnail URL. */
export default function ResourceArt({
  resource,
  detail = false,
}: {
  resource: WebResource;
  detail?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const image = useRef<HTMLImageElement>(null);
  const cover = 'cover' in resource ? resource.cover : null;
  const source = cover ? `/${cover.key}` : '';
  useEffect(() => {
    // A fast failed SSR request can finish before React attaches onError.
    if (source && image.current?.complete && image.current.naturalWidth === 0)
      setFailed(source);
  }, [source]);
  if (!cover) return null;
  return (
    <figure className={`resource-art ${detail ? 'resource-art-detail' : ''}`}>
      {failed === source ? (
        <div className="resource-art-fallback">
          <span>{resource.topic}</span>
          <p>Illustration unavailable</p>
        </div>
      ) : (
        <img
          ref={image}
          src={source}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          loading={detail ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(source)}
        />
      )}
      {detail && (
        <figcaption>
          Editorial concept illustration · {resource.topic}
        </figcaption>
      )}
    </figure>
  );
}
