import { fitWidth, MAX_PHOTO_WIDTH, shrinkForReading } from '../resize';

test('the cap is 1200px wide', () => {
  expect(MAX_PHOTO_WIDTH).toBe(1200);
});

describe('fitWidth', () => {
  test('shrinks a wide photo to exactly the cap', () => {
    expect(fitWidth(4000)).toBe(1200);
    expect(fitWidth(1201)).toBe(1200);
  });
  test('leaves photos at or under the cap alone (never enlarges)', () => {
    expect(fitWidth(1200)).toBeNull();
    expect(fitWidth(800)).toBeNull();
  });
  test('ignores nonsense widths', () => {
    expect(fitWidth(0)).toBeNull();
    expect(fitWidth(NaN)).toBeNull();
    expect(fitWidth(-5)).toBeNull();
  });
});

describe('shrinkForReading', () => {
  test('resizes a big photo, returns the new uri and removes the big original', async () => {
    const manipulate = jest.fn().mockResolvedValue({ uri: 'file://small.jpg', width: 1200, height: 900 });
    const remove = jest.fn().mockResolvedValue(undefined);
    const out = await shrinkForReading({ uri: 'file://big.jpg', width: 4000 }, { manipulate, remove });
    expect(manipulate).toHaveBeenCalledWith('file://big.jpg', 1200);
    expect(remove).toHaveBeenCalledWith('file://big.jpg');
    expect(out).toBe('file://small.jpg');
  });
  test('a small photo is returned untouched', async () => {
    const manipulate = jest.fn();
    const remove = jest.fn();
    const out = await shrinkForReading({ uri: 'file://ok.jpg', width: 1000 }, { manipulate, remove });
    expect(out).toBe('file://ok.jpg');
    expect(manipulate).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
  test('if shrinking fails the error propagates and the original is NOT deleted', async () => {
    const manipulate = jest.fn().mockRejectedValue(new Error('boom'));
    const remove = jest.fn();
    await expect(shrinkForReading({ uri: 'file://big.jpg', width: 4000 }, { manipulate, remove })).rejects.toThrow('boom');
    expect(remove).not.toHaveBeenCalled();
  });
  test('a failure to delete the original does not fail the capture', async () => {
    const manipulate = jest.fn().mockResolvedValue({ uri: 'file://small.jpg' });
    const remove = jest.fn().mockRejectedValue(new Error('cannot delete'));
    await expect(shrinkForReading({ uri: 'file://big.jpg', width: 4000 }, { manipulate, remove })).resolves.toBe('file://small.jpg');
  });
});
