import '@testing-library/jest-dom/vitest'

class IntersectionObserverMock {
  observe(element) {
    element.classList.add('is-visible')
  }

  unobserve() {}

  disconnect() {}
}

globalThis.IntersectionObserver = IntersectionObserverMock

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}
