import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('Simple Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test cn function', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });
});