import { useRef, useEffect, ReactElement } from 'react'
import { BookmarkCardProps } from '../../types'
import './index.scss'

function BookmarkCard({ bookmark, onEdit, onDelete, onPin, isMobile, showActions = false, onActionsToggle }: BookmarkCardProps): ReactElement {
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
    window.open(bookmark.url, '_blank')
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
      <div className="bookmark-icon" style={{ backgroundColor: bookmark.color }}>
        {bookmark.icon.startsWith('data:image/') ? (
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

export default BookmarkCard
