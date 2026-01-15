import { createContext, useState, useContext, useRef, ReactElement, ReactNode, useEffect } from 'react'
import { Message, MessageProviderProps } from '../../types'
import './index.scss'

import { MessageAction } from '../../types';

interface MessageContextType {
  showMessage: (text: string, type?: 'success' | 'error' | 'info', actions?: MessageAction[]) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

function MessageProvider({ children }: MessageProviderProps): ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info', actions?: MessageAction[]): void => {
    const newMessage: Message = {
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      type,
      actions
    }

    setMessages((prev: Message[]): Message[] => [...prev, newMessage])

    // 如果有action按钮，延长消息显示时间
    const duration = actions?.length ? 5000 : (type === 'error' ? 3000 : 2000);
    const timer = window.setTimeout((): void => {
      setMessages((prev: Message[]): Message[] => prev.filter((msg: Message): boolean => msg.id !== newMessage.id))
      timersRef.current.delete(newMessage.id)
    }, duration)

    timersRef.current.set(newMessage.id, timer)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  // 当消息列表变化时，清理不再存在的消息的定时器
  useEffect(() => {
    const currentMessageIds = new Set(messages.map(msg => msg.id))
    timersRef.current.forEach((timer, id) => {
      if (!currentMessageIds.has(id)) {
        clearTimeout(timer)
        timersRef.current.delete(id)
      }
    })
  }, [messages])

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className="messages-container">
        {messages.map((message: Message): ReactNode => (
          <div
            key={message.id}
            className={`message message-${message.type} ${message.actions?.length ? 'has-actions' : ''}`}
          >
            <span className="message-text">{message.text}</span>
            {message.actions && message.actions.length > 0 && (
              <div className="message-actions">
                {message.actions.map((action: MessageAction, index: number) => (
                  <button
                    key={index}
                    className="message-action-btn"
                    onClick={() => {
                      action.onClick();
                      // 点击按钮后关闭消息
                      setMessages((prev: Message[]): Message[] => prev.filter((msg: Message): boolean => msg.id !== message.id));
                    }}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            )}
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
