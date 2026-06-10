import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'
import { TooltipProvider } from "@/components/ui/tooltip"
import { HashRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)
