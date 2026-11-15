import { formatMmSs, secondsLeft } from '../timer';

test('formats mm:ss', () => {
  expect(formatMmSs(600)).toBe('10:00');
  expect(formatMmSs(65)).toBe('01:05');
  expect(formatMmSs(0)).toBe('00:00');
  expect(formatMmSs(-5)).toBe('00:00');
});

test('secondsLeft rounds up and never goes negative', () => {
  expect(secondsLeft(10_000, 4_500)).toBe(6);
  expect(secondsLeft(10_000, 12_000)).toBe(0);
});
