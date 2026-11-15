import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '../domain/types';
import { strings, type StringKey } from './strings';

const KEY = 'kc:settings';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  accepted: boolean;
  accept: () => void;
  resetSettings: () => void;
  loaded: boolean;
  t: (k: StringKey) => string;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [accepted, setAccepted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const s = JSON.parse(raw);
          if (s.lang === 'en' || s.lang === 'pcm') setLangState(s.lang);
          setAccepted(!!s.accepted);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = (next: { lang: Lang; accepted: boolean }) =>
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});

  const value: Ctx = {
    lang,
    accepted,
    loaded,
    setLang: (l) => {
      setLangState(l);
      persist({ lang: l, accepted });
    },
    accept: () => {
      setAccepted(true);
      persist({ lang, accepted: true });
    },
    resetSettings: () => {
      setLangState('en');
      setAccepted(false);
      persist({ lang: 'en', accepted: false });
    },
    t: (k) => strings[lang][k],
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings must be used inside SettingsProvider');
  return c;
}
