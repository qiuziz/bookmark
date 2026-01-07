import { useRef, useEffect } from 'react'
import './BookmarkCard.scss'

function BookmarkCard({ bookmark, onEdit, onDelete, onPin, isMobile, showActions = false, onActionsToggle }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      if (showActions && isMobile && onActionsToggle) {
        onActionsToggle()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showActions, isMobile, onActionsToggle])

  useEffect(() => {
    if (!showActions || !onActionsToggle) return

    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onActionsToggle()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showActions, onActionsToggle])

  const handleClick = (_e) => {
    if (showActions && onActionsToggle) {
      onActionsToggle()
      return
    }
    window.open(bookmark.url, '_blank')
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(bookmark)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm('确定要删除这个书签吗？')) {
      onDelete(bookmark.id)
    }
  }

  const handlePin = (e) => {
    e.stopPropagation()
    onPin(bookmark)
  }

  const toggleActions = (e) => {
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
        {bookmark.icon}
      </div>
      <div className="bookmark-info">
        <span className="bookmark-title">{bookmark.title}</span>
      </div>
      
      <div className="card-actions-trigger" onClick={toggleActions}>
        <span className="more-dots">···</span>
      </div>
      
      <div className={`bookmark-actions-overlay ${showActions ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
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
