import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from './components/Toast.jsx'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = "72588428050-2ou8i0d2bn23jirg6dieu04tuh5i2irr.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

