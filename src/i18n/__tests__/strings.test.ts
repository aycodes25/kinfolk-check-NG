import { strings } from '../strings';

test('every key exists in both languages and is non-empty', () => {
  const en = Object.keys(strings.en).sort();
  const pcm = Object.keys(strings.pcm).sort();
  expect(pcm).toEqual(en);
  for (const k of en) {
    expect((strings.en as any)[k].length).toBeGreaterThan(0);
    expect((strings.pcm as any)[k].length).toBeGreaterThan(0);
  }
});

test('product name appears in full, never as plain "Kinfolk Check" alone', () => {
  const text = JSON.stringify(strings);
  const bad = text.match(/Kinfolk Check(?! NG)/g);
  expect(bad).toBeNull();
});

test('strings never call the reading AI or automatic', () => {
  expect(JSON.stringify(strings)).not.toMatch(/\bAI result\b|Automatic result/i);
});
