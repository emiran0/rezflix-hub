// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.).
import "@testing-library/jest-dom/vitest"

// jsdom doesn't implement matchMedia; Motion's useReducedMotion (and any media-query
// hook) needs it. Default to "no preference" (motion enabled) in tests.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
