import { useState, useRef, useEffect, ReactElement } from 'react'
import { Folder } from '../types'
import './folder-selector.scss'

interface FolderSelectorProps {
  folders: Folder[]
  currentPath: string[]
  value: string | null
  onChange: (value: string | null) => void
}

interface FolderWithDepth extends Folder {
  depth: number
}

function FolderSelector({ folders, currentPath, value, onChange }: FolderSelectorProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const getFolderPath = (folder: Folder): string => {
    return folder.path.map((id: string): string => {
      const pathFolder: Folder | undefined = folders.find((f: Folder): boolean => f.id === id)
      return pathFolder?.title ?? ''
    }).join('')
  }

  const getSelectedFolder = (): Folder | null => {
    if (!value) return null
    return folders.find((f: Folder): boolean => f.id === value) ?? null
  }

  const sortedFolders: FolderWithDepth[] = folders
    .map((folder: Folder): FolderWithDepth => ({
      ...folder,
      depth: folder.path.length
    }))
    .sort((a: FolderWithDepth, b: FolderWithDepth): number => {
      if (a.depth !== b.depth) return a.depth - b.depth
      return a.title.localeCompare(b.title)
    })

  useEffect((): () => void => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return (): void => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect((): void => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect: DOMRect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth: number = Math.min(buttonRect.width, 280)

      dropdownRef.current.style.width = `${dropdownWidth}px`
      dropdownRef.current.style.left = `${buttonRect.left}px`
      dropdownRef.current.style.top = `${buttonRect.bottom + 4}px`
    }
  }, [isOpen])

  const handleSelect = (folderId: string | null): void => {
    onChange(folderId)
    setIsOpen(false)
  }

  // 添加触摸事件支持
  const handleTouchStart = (e: React.TouchEvent): void => {
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const selectedFolder: Folder | null = getSelectedFolder()
  const displayText: string = value
    ? (selectedFolder?.title ?? '未知文件夹')
    : '根目录'

  return (
    <div className="folder-selector">
      <button
        ref={buttonRef}
        type="button"
        className="folder-selector-trigger"
        onClick={(): void => setIsOpen(!isOpen)}
        onTouchStart={handleTouchStart}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="folder-selector-label">{displayText}</span>
        <span className={`folder-selector-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="folder-selector-dropdown">
          <div
            className={`folder-option ${value === null ? 'selected' : ''}`}
            onClick={(): void => handleSelect(null)}
          >
            <span className="folder-option-icon">📁</span>
            <span className="folder-option-text">根目录</span>
          </div>

          {sortedFolders.map((folder: FolderWithDepth): ReactElement => (
            <div
                key={folder.id}
                className={`folder-option ${value === folder.id ? 'selected' : ''}`}
                onClick={(): void => handleSelect(folder.id)}
                style={{ '--depth': folder.depth } as React.CSSProperties}
              >
                <span
                  className="folder-option-indent"
                  style={{ width: `${folder.depth * 16}px` }}
                />
                <span className="folder-option-icon">📁</span>
                <span className="folder-option-text">{folder.title}</span>
                {folder.path.length > 0 && (
                  <span className="folder-option-path">
                    {getFolderPath(folder)}
                  </span>
                )}
              </div>
          ))}

          {sortedFolders.length === 0 && (
            <div className="folder-option-empty">
              暂无文件夹
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FolderSelector
