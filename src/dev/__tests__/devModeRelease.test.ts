import * as fs from 'fs';
import * as path from 'path';

describe('Skip wait can never exist in a release (Play Store) build', () => {
  const realDev = (global as any).__DEV__;
  afterEach(() => {
    (global as any).__DEV__ = realDev;
    jest.resetModules();
  });

  test('with __DEV__ = false the shared devMode is unavailable and 5 taps never unlock it', () => {
    (global as any).__DEV__ = false;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { devMode } = require('../devMode');
    for (let i = 0; i < 100; i++) devMode.registerTap(1000 + i);
    expect(devMode.available).toBe(false);
    expect(devMode.isUnlocked()).toBe(false);
  });

  test('with __DEV__ = true it can be unlocked (development builds only)', () => {
    (global as any).__DEV__ = true;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { devMode } = require('../devMode');
    for (let i = 0; i < 5; i++) devMode.registerTap(1000 + i);
    expect(devMode.isUnlocked()).toBe(true);
  });

  test('the only "Skip wait" in the app sits behind the unlocked dev-mode flag', () => {
    const root = path.resolve(__dirname, '../../..');
    const timer = fs.readFileSync(path.join(root, 'app/test/timer.tsx'), 'utf8');
    expect(timer.match(/Skip wait/g)).toHaveLength(1);
    expect(timer).toMatch(/dev\.unlocked\s*&&[\s\S]{0,80}Skip wait/);
    const dev = fs.readFileSync(path.join(root, 'src/dev/devMode.ts'), 'utf8');
    expect(dev).toMatch(/available:\s*__DEV__/);
  });
});
