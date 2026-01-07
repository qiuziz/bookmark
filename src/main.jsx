import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { MessageProvider } from './components/MessageProvider'
import './styles/index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MessageProvider>
      <App />
    </MessageProvider>
  </React.StrictMode>
)
