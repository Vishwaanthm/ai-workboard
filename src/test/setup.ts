import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// jsdom has no 2D canvas; return null (as a browser without canvas support would) instead of logging
// "not implemented" for every hero render. HeroNetwork treats a null context as "draw nothing".
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

afterEach(() => {
  window.localStorage.clear()
})
