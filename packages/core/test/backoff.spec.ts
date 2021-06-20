import { exponential, linear } from '../src';

describe('backoff', () => {
  describe('exponential', () => {
    it.each([
      [0, 400],
      [1, 800],
      [2, 1600],
      [3, 3200],
    ])('should match %p with: %p', (retry, expected) => {
      expect(exponential(200)(retry)).toBe(expected);
    });
  });

  describe('linear', () => {
    it.each([
      [0, 400],
      [1, 800],
      [2, 1200],
      [3, 1600],
    ])('should match %p with: %p', (retry, expected) => {
      expect(linear(200)(retry)).toBe(expected);
    });
  });
});
