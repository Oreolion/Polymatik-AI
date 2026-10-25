import { createContext, use, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemePreference } from '@polymatik/ui-tokens';

type Session = {
  saved: string[];
  dismissed: string[];
  undoId: string | null;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleSave: (id: string) => void;
  dismiss: (id: string) => void;
  undoDismiss: () => void;
};
const SessionContext = createContext<Session | null>(null);

/** Local preview only: no file writes, accounts, sync or module-global user state. */
export function DiscoverySession({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [preference, setPreference] = useState<ThemePreference>('system');
  return (
    <SessionContext
      value={{
        saved,
        dismissed,
        undoId,
        preference,
        setPreference,
        toggleSave: (id) =>
          setSaved((current) =>
            current.includes(id)
              ? current.filter((value) => value !== id)
              : [...current, id],
          ),
        dismiss: (id) => {
          setDismissed((current) => [...new Set([...current, id])]);
          setUndoId(id);
        },
        undoDismiss: () => {
          setDismissed((current) => current.filter((id) => id !== undoId));
          setUndoId(null);
        },
      }}
    >
      {children}
    </SessionContext>
  );
}

export function useDiscoverySession() {
  const session = use(SessionContext);
  if (!session) throw new Error('DiscoverySession provider is required');
  return session;
}
