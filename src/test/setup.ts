import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// jsdom has no canvas contexts; return null (as a browser without WebGL would) instead of logging
// "not implemented" for every hero render. HeroField then shows its static poster. Tests that need a
// live field stub getContext with a fake WebGL context (see hero-field.test.tsx).
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

afterEach(() => {
  window.localStorage.clear()
})
