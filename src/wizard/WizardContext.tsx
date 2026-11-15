import React, { createContext, useContext, useState } from 'react';
import type { TestKind } from '../domain/types';
import type { ReadResult } from '../vision/types';

type Ctx = {
  photos: Partial<Record<TestKind, string>>;
  suggestions: Partial<Record<TestKind, ReadResult>>;
  confirmed: Partial<Record<TestKind, string>>;
  timerDone: boolean;
  setTimerDone: (v: boolean) => void;
  setPhoto: (k: TestKind, uri: string) => void;
  setSuggestion: (k: TestKind, r: ReadResult) => void;
  setConfirmed: (k: TestKind, v: string) => void;
  reset: () => void;
};

const WizardContext = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Ctx['photos']>({});
  const [suggestions, setSuggestions] = useState<Ctx['suggestions']>({});
  const [confirmed, setConfirmedState] = useState<Ctx['confirmed']>({});
  const [timerDone, setTimerDone] = useState(false);
  const value: Ctx = {
    photos,
    suggestions,
    confirmed,
    timerDone,
    setTimerDone,
    setPhoto: (k, uri) => setPhotos((p) => ({ ...p, [k]: uri })),
    setSuggestion: (k, r) => setSuggestions((p) => ({ ...p, [k]: r })),
    setConfirmed: (k, v) => setConfirmedState((p) => ({ ...p, [k]: v })),
    reset: () => {
      setPhotos({});
      setSuggestions({});
      setConfirmedState({});
      setTimerDone(false);
    },
  };
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): Ctx {
  const c = useContext(WizardContext);
  if (!c) throw new Error('useWizard must be used inside WizardProvider');
  return c;
}
