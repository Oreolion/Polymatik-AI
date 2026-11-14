'use client';
import { useEffect, useRef, useState } from 'react';
import {
  readBrowserCatalog,
  resolveDeviceResources,
  type UnresolvedResource,
} from '../src/catalog-browser';
import type { ResourceCatalogState, WebResource } from '../src/catalog';
import type { Topic } from '../src/discover';

/** Explicit page navigation, with cancellation on filter/view/page changes. */
export function useCatalogPages(
  initial: ResourceCatalogState,
  enabled: boolean,
  topic: Topic,
  query: string,
) {
  const key = JSON.stringify([topic, query.trim()]);
  const initialKey = JSON.stringify(['All subjects', '']);
  const [navigation, setNavigation] = useState<{
    key: string;
    cursors: (string | undefined)[];
    page: number;
  }>({ key: initialKey, cursors: [undefined], page: 0 });
  const page = navigation.key === key ? navigation.page : 0;
  const cursor = navigation.key === key ? navigation.cursors[page] : undefined;
  const [result, setResult] = useState({
    key: initialKey,
    page: 0,
    state: initial,
  });
  const [revision, setRevision] = useState(0);
  const primed = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (
      !primed.current &&
      key === initialKey &&
      page === 0 &&
      initial.status === 'ready'
    ) {
      primed.current = true;
      setResult({ key, page, state: initial });
      return;
    }
    primed.current = true;
    const controller = new AbortController();
    setResult({ key, page, state: { status: 'loading' } });
    const timer = setTimeout(() => {
      void readBrowserCatalog(
        {
          ...(topic !== 'All subjects' ? { subject: topic } : {}),
          ...(query.trim() ? { q: query.trim() } : {}),
          ...(cursor ? { cursor } : {}),
        },
        controller.signal,
      ).then((state) => {
        if (!controller.signal.aborted) setResult({ key, page, state });
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, key, page, cursor, revision, initialKey, initial, topic, query]);
  const state: ResourceCatalogState =
    result.key === key && result.page === page
      ? result.state
      : { status: 'loading' };
  const nextCursor = state.status === 'ready' ? state.nextCursor : undefined;
  return {
    state,
    page: page + 1,
    previous: page > 0,
    next: Boolean(nextCursor),
    retry: () => setRevision((value) => value + 1),
    goPrevious: () =>
      setNavigation((current) => ({ ...current, page: Math.max(0, page - 1) })),
    goNext: () => {
      if (!nextCursor) return;
      setNavigation({
        key,
        page: page + 1,
        cursors: [
          ...(navigation.key === key
            ? navigation.cursors.slice(0, page + 1)
            : [undefined]),
          nextCursor,
        ],
      });
    },
  };
}

export function useDeviceResources(ids: readonly string[], enabled: boolean) {
  const key = JSON.stringify(ids);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    loading: boolean;
    items: WebResource[];
    unresolved: UnresolvedResource[];
    savedAs: Record<string, string[]>;
  }>({ key: '[]', loading: false, items: [], unresolved: [], savedAs: {} });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const savedIds: string[] = JSON.parse(key);
    setResult({ key, loading: true, items: [], unresolved: [], savedAs: {} });
    void resolveDeviceResources(savedIds, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, loading: false, ...data });
      },
      () => {
        if (!controller.signal.aborted)
          setResult({
            key,
            loading: false,
            items: [],
            savedAs: {},
            unresolved: savedIds.map((id) => ({ id, status: 'unavailable' })),
          });
      },
    );
    return () => controller.abort();
  }, [enabled, key, revision]);
  return {
    ...result,
    loading: enabled && (result.key !== key || result.loading),
    retry: () => setRevision((value) => value + 1),
  };
}
