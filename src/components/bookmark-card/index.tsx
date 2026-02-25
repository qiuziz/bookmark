import React, { useRef, useEffect, ReactElement } from 'react'
import { BookmarkCardProps } from '../../types'
import './index.scss'

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit, onDelete, onPin, isMobile, showActions = false, onActionsToggle }): ReactElement => {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect((): (() => void) | void => {
    const handleResize = (): void => {
      if (showActions && isMobile && onActionsToggle) {
        onActionsToggle()
      }
    }

    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [showActions, isMobile, onActionsToggle])

  useEffect((): (() => void) | void => {
    if (!showActions || !onActionsToggle) return

    const handleClickOutside = (e: MouseEvent): void => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onActionsToggle()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return (): void => document.removeEventListener('click', handleClickOutside)
  }, [showActions, onActionsToggle])

  const handleClick = (_e: React.MouseEvent): void => {
    if (showActions && onActionsToggle) {
      onActionsToggle()
      return
    }
    
    // 检查是否为插件环境
    const isPluginMode = import.meta.env.VITE_PLUGIN === 'true';
    
    if (isPluginMode) {
      // 在插件环境下
      const chromeWindow = window as any;
      
      // 检查是否是弹出窗口
      // 弹出窗口通常有较窄的尺寸，且有window.close方法
      const isPopup = window.innerWidth < 800 && window.innerHeight < 800;
      
      if (isPopup && typeof chromeWindow.chrome !== 'undefined' && chromeWindow.chrome.tabs) {
        // 在弹出窗口模式下，使用chrome.tabs API在新标签页打开链接
        chromeWindow.chrome.tabs.create({ url: bookmark.url });
        // 关闭弹出窗口
        if (window.close) {
          window.close();
        }
      } else {
        // 在标签页模式或没有chrome.tabs API时，在当前页打开链接
        window.location.href = bookmark.url;
      }
    } else {
      // 在普通网页模式下，直接在当前窗口打开链接
      window.location.href = bookmark.url;
    }
  }

  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onEdit(bookmark)
  }

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (confirm('确定要删除这个书签吗？')) {
      onDelete(bookmark.id)
    }
  }

  const handlePin = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onPin(bookmark)
  }

  const toggleActions = (e: React.MouseEvent): void => {
    e.stopPropagation()
    e.preventDefault()
    if (onActionsToggle) {
      onActionsToggle()
    }
  }

  return (
    <div 
      ref={cardRef}
      className={`bookmark-card ${isMobile ? 'mobile' : ''} ${bookmark.isPinned ? 'pinned' : ''}${showActions ? ' actions-open' : ''}`}
      onClick={handleClick}
    >
      {bookmark.isPinned && <div className="pinned-badge">置顶</div>}
      <div className="bookmark-icon">
        {(bookmark.icon?.startsWith?.('data:image/') || bookmark.icon?.startsWith?.('http')) ? (
          <img src={bookmark.icon} alt={bookmark.title} className="favicon-img" />
        ) : (
          bookmark.icon
        )}
      </div>
      <div className="bookmark-info">
        <span className="bookmark-title">{bookmark.title}</span>
      </div>
      
      <div className="card-actions-trigger" onClick={toggleActions}>
        <span className="more-dots">···</span>
      </div>
      
      <div className={`bookmark-actions-overlay ${showActions ? 'visible' : ''}`} onClick={(e: React.MouseEvent): void => e.stopPropagation()}>
          <button className="action-btn pin" onClick={handlePin}>
            {bookmark.isPinned ? '取消置顶' : '置顶'}
          </button>
          <button className="action-btn edit" onClick={handleEdit}>编辑</button>
          <button className="action-btn delete" onClick={handleDelete}>删除</button>
        </div>
    </div>
  )
}

export default React.memo(BookmarkCard)
