export default function LoadingResource() {
  return (
    <main
      id="main-content"
      className="runtime-fixture"
      tabIndex={-1}
      aria-busy="true"
    >
      <p className="eyebrow">THE PREVIEW COLLECTION</p>
      <div role="status">
        <h1>Opening this resource…</h1>
        <p>Loading its source information.</p>
      </div>
      <nav>
        <a href="/">Back to Discover</a>
      </nav>
    </main>
  );
}
