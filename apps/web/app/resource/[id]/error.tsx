'use client';

export default function ResourceError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="runtime-fixture" tabIndex={-1}>
      <p className="eyebrow">THE PREVIEW COLLECTION</p>
      <h1>This page could not be opened.</h1>
      <p role="alert">Please try again. Your device Library has not changed.</p>
      <nav aria-label="Resource recovery">
        <button type="button" onClick={reset}>
          Try again
        </button>
        <a href="/">Back to Discover</a>
      </nav>
    </main>
  );
}
