import { useRef, useCallback, useEffect } from 'react'
import { FolderCardProps } from '../../types'
import './index.scss'

function FolderCard({ folder, onClick, onRename, onDelete, isMobile, showActions = false, onActionsToggle }: FolderCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleActionClick = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    onActionsToggle?.()
  }, [onActionsToggle])

  const handleRename = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    onActionsToggle?.()
    onRename?.(folder)
  }, [folder, onRename, onActionsToggle])

  const handleDelete = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    onActionsToggle?.()
    onDelete?.(folder.id)
  }, [folder, onDelete, onActionsToggle])

  const handleClickOutside = useCallback((e: MouseEvent): void => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onActionsToggle?.()
    }
  }, [onActionsToggle])

  useEffect((): (() => void) | void => {
    if (showActions) {
      document.addEventListener('click', handleClickOutside)
      return (): void => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActions, handleClickOutside])

  return (
    <div ref={cardRef} className={`folder-card ${isMobile ? 'mobile' : ''} ${showActions ? 'actions-open' : ''}`} onClick={(): void => onClick(folder)}>
      <div className="folder-icon">📁</div>
      <div className="folder-info">
        <span className="folder-title">{folder.title}</span>
      </div>
      <div className="folder-actions" ref={menuRef}>
        <button
          className={`folder-actions-btn ${isMobile ? 'mobile' : ''}`}
          onClick={handleActionClick}
          aria-label="操作"
        >
          ⋮
        </button>
        {showActions && (
          <div className="folder-actions-menu">
            <button className="menu-item rename" onClick={handleRename}>
              重命名
            </button>
            <button className="menu-item delete" onClick={handleDelete}>
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FolderCard
