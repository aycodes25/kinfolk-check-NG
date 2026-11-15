import { createDevMode } from '../devMode';

describe('devMode', () => {
  it('5 quick taps unlock when available', () => {
    const d = createDevMode({ available: true });
    for (let i = 0; i < 5; i++) d.registerTap(1000 + i * 100);
    expect(d.isUnlocked()).toBe(true);
  });
  it('4 taps do not unlock', () => {
    const d = createDevMode({ available: true });
    for (let i = 0; i < 4; i++) d.registerTap(1000 + i * 100);
    expect(d.isUnlocked()).toBe(false);
  });
  it('taps spread beyond the window do not accumulate', () => {
    const d = createDevMode({ available: true });
    for (let i = 0; i < 10; i++) d.registerTap(i * 1000);
    expect(d.isUnlocked()).toBe(false);
  });
  it('never unlocks when not available (release builds)', () => {
    const d = createDevMode({ available: false });
    for (let i = 0; i < 50; i++) d.registerTap(1000 + i);
    expect(d.available).toBe(false);
    expect(d.isUnlocked()).toBe(false);
  });
  it('lock() re-locks', () => {
    const d = createDevMode({ available: true });
    for (let i = 0; i < 5; i++) d.registerTap(1000 + i);
    d.lock();
    expect(d.isUnlocked()).toBe(false);
  });
  it('notifies subscribers on unlock and supports unsubscribe', () => {
    const d = createDevMode({ available: true });
    const l = jest.fn();
    const off = d.subscribe(l);
    for (let i = 0; i < 5; i++) d.registerTap(1000 + i);
    expect(l).toHaveBeenCalledTimes(1);
    off();
    d.lock();
    expect(l).toHaveBeenCalledTimes(1);
  });
});
