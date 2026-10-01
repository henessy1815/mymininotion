import { vi } from 'vitest';

/**
 * Double for `next/navigation`. The App Router context only exists inside
 * Next, so this is the one boundary component tests replace. The router
 * mirrors every method of `AppRouterInstance`; assert on the calls that are
 * part of the contract, e.g. `expect(nav.router.push).toHaveBeenCalledWith('/pages/…')`.
 *
 * Usage in a test file:
 *   vi.mock('next/navigation', () => import('@/test/navigation'));
 *   import { nav } from '@/test/navigation';
 *   nav.params = { id: 'p1' };
 */
function createRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
}

type NavState = {
  router: ReturnType<typeof createRouter>;
  pathname: string;
  params: Record<string, string>;
};

// Kept on globalThis so `loadStore()`'s vi.resetModules() — which re-evaluates
// this module — cannot split the test's `nav` from the component's.
const g = globalThis as typeof globalThis & { __navDouble?: NavState };
export const nav: NavState = (g.__navDouble ??= {
  router: createRouter(),
  pathname: '/',
  params: {},
});

/** Called from test/setup.ts after every test. */
export function resetNavigation() {
  nav.router = createRouter();
  nav.pathname = '/';
  nav.params = {};
}

export const useRouter = () => nav.router;
export const usePathname = () => nav.pathname;
export const useParams = () => nav.params;
export const useSearchParams = () => new URLSearchParams();
