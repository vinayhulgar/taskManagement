import { describe, it, expect } from 'vitest';

describe('Simple Store Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import auth store without errors', async () => {
    const { useAuthStore } = await import('../auth-store');
    expect(useAuthStore).toBeDefined();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});