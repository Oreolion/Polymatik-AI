import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Topic({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,48}$/.test(slug)) notFound();
  return (
    <main>
      <p className="eyebrow">DYNAMIC ROUTE</p>
      <h1>Topic: {slug}</h1>
      <Link href="/">Back to Polymatik AI</Link>
    </main>
  );
}
