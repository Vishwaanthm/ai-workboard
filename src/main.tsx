import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource-variable/geist-mono/index.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppStateProvider } from './context/AppState'
import { courseData, placeholderFiles } from './data'
import { validateCourseData } from './data/validate'
import { buildRoutes } from './routes'

if (import.meta.env.DEV) {
  const problems = validateCourseData(courseData)
  if (problems.length > 0) console.error('[course data] invalid:\n' + problems.join('\n'))
  if (placeholderFiles.length > 0) {
    console.warn(`[course data] placeholder content still in: ${placeholderFiles.join(', ')}`)
  }
}

const router = createBrowserRouter(buildRoutes(), { basename: import.meta.env.BASE_URL })

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  </StrictMode>,
)
