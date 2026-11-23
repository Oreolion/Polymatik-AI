'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { interestSubjects } from '@polymatik/domain-types/interests';
import { catalogSubjects } from '@polymatik/domain-types/catalog-v2';
import type { InterestsV2 } from '@polymatik/domain-types/account-v2';
import {
  accountInterests,
  AccountInterestsError,
} from '../src/account-interests';

type InterestSubject = (typeof catalogSubjects)[number];
const descriptions: Record<InterestSubject, string> = {
  Physics: 'Matter, motion, and the rules beneath everyday things.',
  Mathematics: 'Patterns, probability, and new ways to reason.',
  Computing: 'The systems and tools that shape our digital world.',
  Biology: 'Living systems, from cells to ecosystems.',
  Psychology: 'How minds, behavior, and experience connect.',
  Philosophy: 'Questions about knowledge, ethics, and meaning.',
  Sociology: 'People, institutions, and the patterns of shared life.',
  Chemistry: 'Elements, reactions, and the ways matter changes.',
  Art: 'Images, materials, and ways of seeing and making.',
  Metaphysics: 'Questions about existence, identity, time, and reality.',
  Politics: 'Power, governance, and competing visions of public life.',
  History: 'People, events, and the evidence that connects past and present.',
  Literature: 'Stories, language, and the worlds they open.',
  Economics: 'Choices, institutions, and how resources are shared.',
};

export default function AccountInterests({
  accountId,
  disabled,
  expanded = false,
  onComplete,
}: {
  accountId: string;
  disabled: boolean;
  expanded?: boolean;
  onComplete?: () => void;
}) {
  const [saved, setSaved] = useState<InterestsV2 | null>(null);
  const [subjects, setSubjects] = useState<InterestSubject[]>([]);
  const choices = expanded ? catalogSubjects : interestSubjects;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setSaved(null);
    setSubjects([]);
    setError('');
    setExpired(false);
    setNotice('');
    void accountInterests('GET', undefined, {
      accountId,
      signal: controller.signal,
      expanded,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          if (onComplete && value.status !== 'not_started') {
            onComplete();
            return;
          }
          setSaved(value);
          setSubjects(value.subjects);
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          const changed =
            failure instanceof AccountInterestsError &&
            [401, 409].includes(failure.status);
          setExpired(changed);
          setError(
            changed
              ? failure.message
              : 'Your interests could not be loaded. You can keep exploring.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, [accountId, revision, expanded, onComplete]);

  const dirty = saved && subjects.join('|') !== saved.subjects.join('|');
  async function change(action: 'save' | 'skip' | 'reset', event?: FormEvent) {
    event?.preventDefault();
    if (busy || loading || disabled || expired || !saved) return;
    if (action === 'save' && !subjects.length) {
      setError('Choose at least one subject, or skip for now.');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const value = await accountInterests(
        action === 'reset' ? 'DELETE' : 'PUT',
        action === 'reset'
          ? undefined
          : action === 'skip'
            ? { status: 'skipped', subjects: [] }
            : { status: 'selected', subjects },
        { accountId, signal: controller.signal, expanded },
      );
      if (!controller.signal.aborted) {
        if (onComplete && action !== 'reset') {
          onComplete();
          return;
        }
        setSaved(value);
        setSubjects(value.subjects);
        setNotice(
          action === 'save'
            ? 'Your subject interests are saved to this account.'
            : action === 'skip'
              ? 'Skipped for now. You can choose subjects whenever you like.'
              : 'Your subject choices have been cleared. Your saved resources are unchanged.',
        );
        heading.current?.focus();
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        const changed =
          failure instanceof AccountInterestsError &&
          [401, 409].includes(failure.status);
        setExpired(changed);
        if (changed) {
          setSaved(null);
          setSubjects([]);
        }
        setError(
          changed
            ? failure.message
            : 'Your changes could not be confirmed. Refresh to check what was saved; your current choices are kept here.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <section
      className="profile-section subject-interests"
      aria-labelledby="interests-title"
      aria-busy={loading || busy || undefined}
    >
      <div className="account-library-heading">
        <p className="eyebrow">
          {onComplete ? 'FOLLOW YOUR CURIOSITY' : '03 / FOLLOW YOUR CURIOSITY'}
        </p>
        <span className="account-library-privacy">Optional · Private</span>
      </div>
      <h2 id="interests-title" ref={heading} tabIndex={-1}>
        Where would you like to begin?
      </h2>
      <p>
        Choose the subjects you want to return to. Start with one, or leave room
        to wander.
      </p>
      {loading ? (
        <p className="account-library-state" role="status">
          Opening your subject choices…
        </p>
      ) : (
        saved && (
          <form onSubmit={(event) => void change('save', event)}>
            <fieldset
              className="interest-choices"
              disabled={disabled || busy}
              aria-describedby="interests-help"
            >
              <legend>
                Your subjects{' '}
                <span className="interest-count" role="status">
                  {subjects.length} / 3 selected
                </span>
              </legend>
              <p id="interests-help" className="profile-caption">
                {expanded
                  ? 'Choose up to three of fourteen subjects. Some areas are still growing.'
                  : 'Choose up to three subjects from the current collection.'}{' '}
                You can change your choices later.
              </p>
              {choices.map((subject, index) => (
                <label className="interest-choice" key={subject}>
                  <input
                    type="checkbox"
                    name="subject"
                    value={subject}
                    checked={subjects.includes(subject)}
                    disabled={
                      !subjects.includes(subject) && subjects.length >= 3
                    }
                    onChange={(event) => {
                      const next = event.currentTarget.checked
                        ? [...subjects, subject]
                        : subjects.filter((item) => item !== subject);
                      setSubjects(
                        choices.filter((item) => next.includes(item)),
                      );
                      setNotice('');
                    }}
                  />
                  <span className="interest-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="interest-copy">
                    <strong>{subject}</strong>
                    <span>{descriptions[subject]}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="interest-actions">
              <button
                className="detail-primary"
                type="submit"
                disabled={
                  disabled ||
                  busy ||
                  !subjects.length ||
                  (!dirty && saved.status === 'selected')
                }
              >
                {busy
                  ? 'Saving…'
                  : onComplete
                    ? 'Save and explore'
                    : 'Save interests'}
              </button>
              <button
                className="interest-secondary"
                type="button"
                disabled={disabled || busy || saved.status === 'skipped'}
                onClick={() => void change('skip')}
              >
                Skip for now
              </button>
              {saved.status !== 'not_started' && (
                <button
                  className="interest-secondary"
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => void change('reset')}
                >
                  Clear saved choices
                </button>
              )}
            </div>
            <p className="profile-caption">
              {dirty
                ? 'You have unsaved changes. '
                : saved.status === 'skipped'
                  ? 'You skipped subject selection. '
                  : saved.status === 'selected'
                    ? 'Saved to your account. '
                    : ''}
              These choices record curiosity, not knowledge or progress.{' '}
              {expanded
                ? 'Choose For you in Discover to explore your interests.'
                : 'You can edit your choices here whenever you like.'}
            </p>
          </form>
        )
      )}
      {error && (
        <div className="profile-error" role="alert">
          <p>{error}</p>
          {expired ? (
            <a className="detail-back" href="/profile">
              Reload account
            </a>
          ) : (
            <button
              className="detail-save"
              type="button"
              disabled={disabled || busy}
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh interests
            </button>
          )}
        </div>
      )}
      {notice && (
        <p className="profile-notice" role="status">
          {notice}
        </p>
      )}
      <a className="detail-back interest-explore" href="/">
        Keep exploring <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
