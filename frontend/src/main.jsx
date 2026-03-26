import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set global base URL for production API calls
// Locally, VITE_API_BASE_URL is undefined, falling back to '' and letting Vite proxy handle it.
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''

// Register service worker for PWA
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
