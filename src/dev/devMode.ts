import { useSyncExternalStore } from 'react';

export type DevMode = {
  readonly available: boolean;
  isUnlocked(): boolean;
  registerTap(now?: number): void;
  lock(): void;
  subscribe(listener: () => void): () => void;
};

export function createDevMode(opts: { available: boolean; taps?: number; windowMs?: number }): DevMode {
  const needed = opts.taps ?? 5;
  const windowMs = opts.windowMs ?? 3000;
  let unlocked = false;
  let times: number[] = [];
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    available: opts.available,
    isUnlocked: () => unlocked,
    registerTap(now = Date.now()) {
      if (!opts.available || unlocked) return;
      times = [...times, now].filter((t) => now - t <= windowMs);
      if (times.length >= needed) {
        unlocked = true;
        times = [];
        emit();
      }
    },
    lock() {
      if (!unlocked) return;
      unlocked = false;
      times = [];
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** In-memory only; `__DEV__` is false in release/production bundles, so it can never unlock there. */
export const devMode: DevMode = createDevMode({ available: __DEV__ });

export function useDevMode(): { available: boolean; unlocked: boolean; registerTap: () => void } {
  const unlocked = useSyncExternalStore(devMode.subscribe, devMode.isUnlocked, devMode.isUnlocked);
  return { available: devMode.available, unlocked, registerTap: () => devMode.registerTap() };
}
