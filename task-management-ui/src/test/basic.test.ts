import { describe, it, expect } from 'vitest';

describe('Basic Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string operations', () => {
    const str = 'hello world';
    expect(str.toUpperCase()).toBe('HELLO WORLD');
  });
});