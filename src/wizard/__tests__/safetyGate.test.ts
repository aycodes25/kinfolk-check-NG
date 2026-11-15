import { shouldPreselect, ackKeyFor, canOpenCamera, canSave, createSingleFlight, emptyAck, isAcknowledged, resetAck, setAcknowledged } from '../safetyGate';

describe('ackKeyFor', () => {
  it('combines genotype, blood group and malaria', () => {
    expect(ackKeyFor({ genotype: 'SS', bloodGroup: 'A+', malaria: 'negative' })).toBe('SS|A+|negative');
    expect(ackKeyFor({})).toBe('||');
  });
  it('changing only the blood group drops an acknowledgement', () => {
    const k1 = ackKeyFor({ genotype: 'SS', bloodGroup: 'A+', malaria: 'negative' });
    const k2 = ackKeyFor({ genotype: 'SS', bloodGroup: 'O+', malaria: 'negative' });
    const s = setAcknowledged(k1, true);
    expect(isAcknowledged(s, k1, true)).toBe(true);
    expect(isAcknowledged(s, k2, true)).toBe(false);
    expect(resetAck(s, k2)).toEqual(emptyAck);
  });
});

describe('isAcknowledged (bug 1: stale lab acknowledgement)', () => {
  it('is false initially', () => {
    expect(isAcknowledged(emptyAck, 'SS|negative', true)).toBe(false);
  });
  it('SS -> AA is false, and after the value change resets the ack, going back to SS is still false', () => {
    let s = setAcknowledged('SS|negative', true);
    expect(isAcknowledged(s, 'SS|negative', true)).toBe(true);
    expect(isAcknowledged(s, 'AA|negative', false)).toBe(false); // derived: never stale on the frame it changes
    s = resetAck(s, 'AA|negative'); // result changed -> stored ack dropped
    expect(isAcknowledged(s, 'SS|negative', true)).toBe(false); // must re-tick
  });
  it('resetAck keeps the ack only while the key is unchanged', () => {
    const s = setAcknowledged('SS|negative', true);
    expect(resetAck(s, 'SS|negative')).toBe(s);
    expect(resetAck(s, 'SC|negative')).toEqual(emptyAck);
  });
  it('SS -> SC (both serious) is false', () => {
    const s = setAcknowledged('SS|negative', true);
    expect(isAcknowledged(s, 'SC|negative', true)).toBe(false);
  });
  it('AA|positive -> AA|invalid is false', () => {
    const s = setAcknowledged('AA|positive', true);
    expect(isAcknowledged(s, 'AA|invalid', true)).toBe(false);
  });
  it('same key and serious is true; non-serious is never acknowledged', () => {
    const s = setAcknowledged('K', true);
    expect(isAcknowledged(s, 'K', true)).toBe(true);
    expect(isAcknowledged(s, 'K', false)).toBe(false);
  });
  it('unticking clears it', () => {
    expect(isAcknowledged(setAcknowledged('K', false), 'K', true)).toBe(false);
  });
});

describe('canSave truth table', () => {
  const base = { complete: true, serious: false, acknowledged: false, saving: false };
  it('serious and not acknowledged -> false', () => {
    expect(canSave({ ...base, serious: true })).toBe(false);
  });
  it('saving -> false', () => {
    expect(canSave({ ...base, saving: true })).toBe(false);
  });
  it('incomplete -> false', () => {
    expect(canSave({ ...base, complete: false })).toBe(false);
  });
  it('serious, acknowledged, complete, not saving -> true', () => {
    expect(canSave({ ...base, serious: true, acknowledged: true })).toBe(true);
  });
  it('non-serious, complete, not saving -> true', () => {
    expect(canSave(base)).toBe(true);
  });
});

describe('createSingleFlight (bug 2: double save)', () => {
  it('runs fn once for two synchronous calls; second resolves undefined', async () => {
    const once = createSingleFlight();
    let resolve!: (v: string) => void;
    const fn = jest.fn(() => new Promise<string>((r) => (resolve = r)));
    const p1 = once(fn);
    const p2 = once(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(await p2).toBeUndefined();
    resolve('done');
    expect(await p1).toBe('done');
  });
  it('allows a new call after the first settles', async () => {
    const once = createSingleFlight();
    const fn = jest.fn(async () => 1);
    await once(fn);
    await once(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it('releases on rejection and propagates the error', async () => {
    const once = createSingleFlight();
    await expect(once(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    const fn = jest.fn(async () => 'ok');
    expect(await once(fn)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('canOpenCamera', () => {
  it('is true only when the timer is done', () => {
    expect(canOpenCamera(true)).toBe(true);
    expect(canOpenCamera(false)).toBe(false);
  });
});

describe('shouldPreselect', () => {
  it('never pre-selects while the profile is untuned', () => {
    expect(shouldPreselect(false, 1, 0.5)).toBe(false);
  });
  it('pre-selects when tuned and confident enough', () => {
    expect(shouldPreselect(true, 0.5, 0.5)).toBe(true);
    expect(shouldPreselect(true, 0.49, 0.5)).toBe(false);
  });
});
