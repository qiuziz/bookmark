import { createContext, useState, useContext, useRef, ReactElement, ReactNode } from 'react'
import { Message, MessageProviderProps } from '../types'
import './Message.scss'

interface MessageContextType {
  showMessage: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

function MessageProvider({ children }: MessageProviderProps): ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info'): void => {
    const newMessage: Message = {
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      type
    }

    setMessages((prev: Message[]): Message[] => [...prev, newMessage])

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout((): void => {
      setMessages((prev: Message[]): Message[] => prev.filter((msg: Message): boolean => msg.id !== newMessage.id))
    }, type === 'error' ? 3000 : 2000)
  }

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className="messages-container">
        {messages.map((message: Message): ReactNode => (
          <div
            key={message.id}
            className={`message message-${message.type}`}
          >
            <span className="message-text">{message.text}</span>
            <button
              className="message-close"
              onClick={(): void => setMessages((prev: Message[]): Message[] => prev.filter((msg: Message): boolean => msg.id !== message.id))}
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

function useMessage(): MessageContextType {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

export { MessageProvider, useMessage }
