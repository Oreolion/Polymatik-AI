'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  evidenceInput,
  type EvidenceResponse,
} from '@polymatik/domain-types/evidence';
import { readEvidence, EvidenceError } from '../src/evidence-client';
import { useManagedClient, type AuthClient } from './use-managed-client';

export default function ResourceResearch({ id }: { id: string }) {
  const { client, loadFailed } = useManagedClient();
  return (
    <section className="resource-research" aria-labelledby="research-heading">
      <header className="research-intro">
        <div>
          <p className="eyebrow">READ WITH A QUESTION</p>
          <h2 id="research-heading">Look closer.</h2>
        </div>
        <p>
          Find passages connected to a question, then check them in context.
          Only reviewed source text can appear here. A matching quotation is a
          starting point for your reading.
        </p>
      </header>
      {loadFailed ? (
        <p role="status">
          Account access is unavailable.{' '}
          <a href="/profile">Open Profile to retry</a>.
        </p>
      ) : client ? (
        <ResearchSession client={client} id={id} />
      ) : (
        <p role="status">Checking research access…</p>
      )}
    </section>
  );
}
function ResearchSession({ client, id }: { client: AuthClient; id: string }) {
  const { data, isPending, error } = client.useSession();
  if (isPending) return <p role="status">Checking your account…</p>;
  if (error || !data?.user)
    return (
      <div className="research-signin">
        <p>
          Sign in to investigate this resource with reviewed source passages.
        </p>
        <a className="detail-save" href="/profile">
          Sign in to continue <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  return (
    <ResearchForm
      key={`${data.user.id}:${id}`}
      id={id}
      accountId={data.user.id}
    />
  );
}
export function ResearchForm({
  id,
  accountId,
}: {
  id: string;
  accountId: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<
    | 'idle'
    | 'loading'
    | 'done'
    | 'cancelled'
    | 'invalid'
    | 'error'
    | 'account'
    | 'missing'
    | 'timeout'
  >('idle');
  const [response, setResponse] = useState<EvidenceResponse | null>(null);
  const [searched, setSearched] = useState('');
  const active = useRef<AbortController | null>(null);
  const results = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (active.current || status === 'account') return;
    setResponse(null);
    const input = evidenceInput({ resource_id: id, query });
    if (!input) {
      setStatus('invalid');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setSearched(input.query);
    setStatus('loading');
    try {
      const page = await readEvidence(input, accountId, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setResponse(page);
        setStatus('done');
        requestAnimationFrame(() => results.current?.focus());
      }
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof EvidenceError
            ? [401, 403, 409].includes(error.status)
              ? 'account'
              : error.status === 404
                ? 'missing'
                : error.status === 504
                  ? 'timeout'
                  : 'error'
            : 'error',
        );
    } finally {
      if (active.current === controller) active.current = null;
    }
  }
  const message = {
    idle: '',
    loading: 'Looking for reviewed source passages…',
    cancelled: 'Lookup cancelled. Your question is still here.',
    invalid: 'Enter a question of up to 500 characters and 32 distinct words.',
    error:
      'Source evidence is unavailable. A reviewed text collection or the research service may not be ready yet. You can still open the original source above.',
    account:
      'Your account session changed. Open Profile and reload before continuing.',
    missing:
      'This resource is no longer available for research. Return to Discover for the current collection.',
    timeout:
      'The lookup took too long. Your question is still here; try again when ready.',
    done: '',
  }[status];
  return (
    <div className="research-workspace">
      <form
        onSubmit={(event) => void submit(event)}
        aria-busy={status === 'loading'}
      >
        <label htmlFor="resource-question">
          What do you want to understand?
        </label>
        <textarea
          id="resource-question"
          rows={3}
          maxLength={1000}
          value={query}
          disabled={status === 'loading' || status === 'account'}
          aria-invalid={status === 'invalid'}
          aria-describedby="research-help research-feedback"
          placeholder="Choose one idea, claim or unfamiliar term from this resource."
          onChange={(event) => {
            setQuery([...event.target.value].slice(0, 500).join(''));
            setResponse(null);
            setStatus('idle');
          }}
        />
        <p id="research-help" className="profile-caption">
          Questions stay out of URLs and browser storage. This lookup returns
          quotations, without generating an answer or recording learning
          progress.
        </p>
        <div className="research-actions">
          <button
            className="detail-primary"
            type="submit"
            disabled={
              status === 'loading' ||
              status === 'account' ||
              status === 'missing'
            }
          >
            {status === 'loading'
              ? 'Finding passages…'
              : ['error', 'timeout'].includes(status)
                ? 'Retry lookup'
                : 'Find source passages'}
            <span aria-hidden="true">↗</span>
          </button>
          {status === 'loading' && (
            <button
              className="detail-save"
              type="button"
              onClick={() => {
                active.current?.abort();
                active.current = null;
                setResponse(null);
                setStatus('cancelled');
              }}
            >
              Cancel lookup
            </button>
          )}
          <span
            className="research-count"
            aria-label={`${[...query].length} of 500 characters`}
          >
            {[...query].length} / 500
          </span>
        </div>
      </form>
      <p
        id="research-feedback"
        role={
          ['invalid', 'error', 'account', 'timeout'].includes(status)
            ? 'alert'
            : 'status'
        }
      >
        {message}
      </p>
      {status === 'account' && <a href="/profile">Open Profile</a>}
      {response && (
        <div
          ref={results}
          tabIndex={-1}
          className="research-results"
          aria-labelledby="research-results-heading"
        >
          <p className="eyebrow">SOURCE NOTES</p>
          <h3 id="research-results-heading">
            {response.status === 'evidence'
              ? 'Passages to investigate'
              : 'No quotations to show yet'}
          </h3>
          <p className="research-searched">
            For your question: <q>{searched}</q>
          </p>
          {response.status !== 'evidence' ? (
            <p>
              {response.status === 'quotation_unavailable'
                ? 'Matching text exists, but its quotation permissions do not allow an excerpt here.'
                : 'No reviewed passage matched this question. Try a term from the source, or open the full work. An empty lookup does not mean the source has no answer.'}
            </p>
          ) : (
            <ol className="research-citations">
              {response.citations.map((citation, position) => (
                <li key={citation.passage_id}>
                  <article aria-labelledby={`citation-title-${position}`}>
                    <p className="research-locator">
                      Passage {position + 1} <span aria-hidden="true">·</span>{' '}
                      Lines {citation.line_start}–{citation.line_end}
                    </p>
                    <blockquote>
                      <p>{citation.quote}</p>
                    </blockquote>
                    <h4 id={`citation-title-${position}`}>
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {citation.title} <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </h4>
                    <p className="research-author">
                      {citation.author} · {citation.version}
                    </p>
                    <details className="research-provenance">
                      <summary>Attribution &amp; passage details</summary>
                      <p>{citation.attribution_notice}</p>
                      <p>{citation.changes_notice}</p>
                      <p>
                        {citation.license_url ? (
                          <a
                            href={citation.license_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {citation.license_label}
                            <span className="sr-only">
                              {' '}
                              (opens in a new tab)
                            </span>
                          </a>
                        ) : (
                          citation.license_label
                        )}
                      </p>
                      <dl>
                        <div>
                          <dt>Source version</dt>
                          <dd>{citation.version}</dd>
                        </div>
                        <div>
                          <dt>Normalized characters</dt>
                          <dd>
                            {citation.start}–{citation.end}
                          </dd>
                        </div>
                        <div>
                          <dt>Source checksum</dt>
                          <dd>
                            <code>{citation.checksum}</code>
                          </dd>
                        </div>
                        <div>
                          <dt>Passage ID</dt>
                          <dd>
                            <code>{citation.passage_id}</code>
                          </dd>
                        </div>
                      </dl>
                    </details>
                  </article>
                </li>
              ))}
            </ol>
          )}
          <aside
            className="research-limitations"
            aria-label="Research limitations"
          >
            <strong>Keep the source in view.</strong>
            {response.limitations.map((value) => (
              <p key={value}>{value}</p>
            ))}
            <p>
              Relevance and the strength of a claim still need your judgment.
              You can change the question and compare passages.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
