import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/home'
import { MessageProvider } from './components/message'
import './styles/index.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MessageProvider>
      <Home />
    </MessageProvider>
  </React.StrictMode>
)
