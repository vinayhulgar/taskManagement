import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from './utils/serviceWorker'
import { performanceMonitor } from './utils/performance'

// Register service worker for offline functionality
registerSW({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('New content available, please refresh:', registration);
    // You could show a toast notification here
  },
  onOfflineReady: () => {
    console.log('App is ready for offline use');
  },
});

// Initialize performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Only monitor performance in production
  console.log('Performance monitoring initialized');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
