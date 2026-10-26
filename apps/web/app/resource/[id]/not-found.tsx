export default function ResourceNotFound() {
  return (
    <main id="main-content" className="runtime-fixture" tabIndex={-1}>
      <p className="eyebrow">THE PREVIEW COLLECTION</p>
      <h1>This resource is not in the collection.</h1>
      <p>Return to Discover to find a resource in this preview.</p>
      <nav>
        <a href="/">Back to Discover</a>
      </nav>
    </main>
  );
}
