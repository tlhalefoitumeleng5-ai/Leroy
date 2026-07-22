import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/contexts/theme-context'
import App from './App'
import { PwaUpdater } from '@/lib/pwa'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <PwaUpdater />
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
