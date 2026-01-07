import { createContext, useState, useContext, useRef } from 'react'
import './Message.scss'

const MessageContext = createContext(undefined)

function MessageProvider({ children }) {
  const [messages, setMessages] = useState([])
  const timerRef = useRef(null)

  const showMessage = (text, type = 'info') => {
    const newMessage = {
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      type
    }

    setMessages(prev => [...prev, newMessage])

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
    }, type === 'error' ? 3000 : 2000)
  }

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className="messages-container">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message message-${message.type}`}
          >
            <span className="message-text">{message.text}</span>
            <button
              className="message-close"
              onClick={() => setMessages(prev => prev.filter(msg => msg.id !== message.id))}
              aria-label="关闭消息"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  )
}

function useMessage() {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

export { MessageProvider, useMessage }
