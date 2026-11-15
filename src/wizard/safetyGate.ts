export type AckState = { key: string; acknowledged: boolean };
export const emptyAck: AckState = { key: '', acknowledged: false };

/** Key identifying the serious combination currently shown, e.g. "SS|A+|negative". */
export function ackKeyFor(confirmed: { genotype?: string; bloodGroup?: string; malaria?: string }): string {
  return `${confirmed.genotype ?? ''}|${confirmed.bloodGroup ?? ''}|${confirmed.malaria ?? ''}`;
}

/** Pre-select an assisted reading only once the kit profile is tuned AND the reading is confident enough. */
export function shouldPreselect(tuned: boolean, confidence: number, minConfidence: number): boolean {
  return tuned === true && confidence >= minConfidence;
}

/** User ticks/unticks the box for the combination `key`. */
export function setAcknowledged(key: string, acknowledged: boolean): AckState {
  return { key, acknowledged };
}

/** Derived, never stale: true only if the stored ack was made for exactly the current key AND the current result is serious. */
export function isAcknowledged(state: AckState, currentKey: string, serious: boolean): boolean {
  return serious && state.acknowledged && state.key === currentKey;
}

/**
 * Call when the user changes a result. Drops the stored ack unless the key is unchanged, so
 * switching away and back to a serious value always needs a fresh tick.
 */
export function resetAck(state: AckState, nextKey: string): AckState {
  return state.key === nextKey ? state : emptyAck;
}

/** Save allowed only if all three tests are confirmed, not already saving, and (if serious) acknowledged. */
export function canSave(args: { complete: boolean; serious: boolean; acknowledged: boolean; saving: boolean }): boolean {
  if (!args.complete || args.saving) return false;
  return args.serious ? args.acknowledged : true;
}

/** Runs `fn` at most once while a previous call is pending (synchronous guard, safe against double taps). */
export function createSingleFlight(): <T>(fn: () => Promise<T>) => Promise<T | undefined> {
  let running = false;
  return async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (running) return undefined;
    running = true;
    try {
      return await fn();
    } finally {
      running = false;
    }
  };
}

/** The camera may only open after the wait timer has finished. */
export function canOpenCamera(timerDone: boolean): boolean {
  return timerDone === true;
}
