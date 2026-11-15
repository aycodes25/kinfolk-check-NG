import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '../../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

// Every screen that shows a genotype, blood group, QR code or kit photo.
const SECURE_SCREENS = ['app/index.tsx', 'app/result/[id].tsx', 'app/history.tsx', 'app/couple/index.tsx', 'app/couple/summary.tsx'];

describe('screens showing health data block screenshots and recording', () => {
  test.each(SECURE_SCREENS)('%s calls useSecureScreen()', (file) => {
    const src = read(file);
    expect(src).toMatch(/import \{ useSecureScreen \} from '.*privacy\/useSecureScreen'/);
    expect(src).toMatch(/useSecureScreen\(\);/);
  });

  test('the hook prevents screen capture through expo-screen-capture', () => {
    const src = read('src/privacy/useSecureScreen.ts');
    expect(src).toContain("from 'expo-screen-capture'");
    expect(src).toMatch(/usePreventScreenCapture\(/);
  });
});
