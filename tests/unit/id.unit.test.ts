import { describe, it, expect } from 'vitest';
import { generateId } from '../../src/lib/utils/id';

describe('generateId', () => {
  it('returns a UUID string when no prefix provided', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  });
});
