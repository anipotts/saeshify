import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Mock window.matchMedia
const matchMediaMock = vi.fn().mockReturnValue({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
});

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('matchMedia', matchMediaMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Import after mocks are set up
describe('PWA Utils', () => {
  it('hasOnboarded returns false when not set', async () => {
    const { hasOnboarded } = await import('@/lib/utils/pwa');
    expect(hasOnboarded()).toBe(false);
  });

  it('hasOnboarded returns true after setOnboarded', async () => {
    const { hasOnboarded, setOnboarded } = await import('@/lib/utils/pwa');
    setOnboarded();
    expect(hasOnboarded()).toBe(true);
  });

  it('setOnboarded stores "1" in localStorage', async () => {
    const { setOnboarded } = await import('@/lib/utils/pwa');
    setOnboarded();
    expect(localStorageMock.getItem('saeshify_onboarded')).toBe('1');
  });

  it('hasDismissedInstallTip returns false when not set', async () => {
    const { hasDismissedInstallTip } = await import('@/lib/utils/pwa');
    expect(hasDismissedInstallTip()).toBe(false);
  });

  it('setDismissedInstallTip marks tip as dismissed', async () => {
    const { hasDismissedInstallTip, setDismissedInstallTip } = await import('@/lib/utils/pwa');
    setDismissedInstallTip();
    expect(hasDismissedInstallTip()).toBe(true);
  });

  it('isStandalone returns false when not in standalone mode', async () => {
    const { isStandalone } = await import('@/lib/utils/pwa');
    matchMediaMock.mockReturnValueOnce({ matches: false });
    expect(isStandalone()).toBe(false);
  });
});
