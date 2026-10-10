import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './design-system/studio.css'
import './design-system/cream.css'
import App from './App.jsx'
import { getRestoredRoute } from './restore-route.js'

const restoredRoute = getRestoredRoute(window.location.href, import.meta.env.BASE_URL)
if (restoredRoute) window.history.replaceState(null, '', restoredRoute)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
