import '@testing-library/jest-dom'

// jsdom has no IntersectionObserver (used by framer-motion whileInView).
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
// @ts-expect-error - test environment stub
globalThis.IntersectionObserver = IOStub
// jsdom has no matchMedia either.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }) as MediaQueryList
}
