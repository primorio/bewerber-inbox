import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles.css'

const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultErrorComponent: ({ error }) => (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-md rounded-xl border border-line bg-surface p-6 text-center">
        <p className="font-serif text-xl">Das hat nicht geklappt.</p>
        <p className="mt-2 text-sm text-muted">{error instanceof Error ? error.message : String(error)}</p>
        <button
          className="mt-4 rounded-lg bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-deep"
          onClick={() => window.location.reload()}
        >
          Neu laden
        </button>
      </div>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  // Bewusst ohne StrictMode: doppelt ausgeführte Effekte würden das Aktivitätsprotokoll verfälschen.
  <RouterProvider router={router} />,
)
