import { useState, useCallback, useMemo, useEffect } from 'react'
import Header from './components/Header'
import BookmarkCard from './components/BookmarkCard'
import FolderCard from './components/FolderCard'
import BookmarkForm from './components/BookmarkForm'
import ImportModal from './components/ImportModal'
import { useBookmarks } from './hooks/useBookmarks'
import { useResponsive } from './hooks/useResponsive'
import { useMessage } from './components/MessageProvider'
import { parseEdgeBookmarks, exportBookmarks } from './utils/edgeBookmarks'
import './App.scss'

function App() {
  const { bookmarks, folders, addBookmark, updateBookmark, deleteBookmark, togglePinBookmark, importBookmarks } = useBookmarks()
  const { isMobile, columns } = useResponsive()
  const { showMessage } = useMessage()
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [activeCardId, setActiveCardId] = useState(null)

  const currentFolderId = useMemo(() => {
    if (currentPath.length === 0) return null
    const pathString = JSON.stringify(currentPath)
    const folder = folders.find(f => JSON.stringify(f.path) === pathString)
    return folder?.id || null
  }, [currentPath, folders])

  const currentFolders = useMemo(() => {
    return folders.filter(f => {
      if (currentPath.length === 0) return f.parentId === null
      return f.parentId === currentFolderId
    })
  }, [folders, currentPath, currentFolderId])

  const currentBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      if (currentPath.length === 0) return b.parentId === null
      return b.parentId === currentFolderId
    })
  }, [bookmarks, currentPath, currentFolderId])

  const hasContent = currentFolders.length > 0 || currentBookmarks.length > 0

  const handleAdd = useCallback(() => {
    setEditingBookmark(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((bookmark) => {
    setEditingBookmark(bookmark)
    setShowForm(true)
  }, [])

  const handleSave = useCallback((formData) => {
    if (editingBookmark) {
      updateBookmark(editingBookmark.id, formData)
    } else {
      addBookmark({
        ...formData,
        parentId: currentFolderId,
        path: currentPath,
        isPinned: formData.isPinned ?? false
      })
    }
    setShowForm(false)
    setEditingBookmark(null)
  }, [editingBookmark, updateBookmark, addBookmark, currentFolderId, currentPath])

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditingBookmark(null)
  }, [])

  const handleOpenImport = useCallback(() => {
    setShowImportModal(true)
  }, [])

  const handleImport = useCallback((htmlContent, _fileName) => {
    try {
      const { folders: importedFolders, bookmarks: importedBookmarks } = parseEdgeBookmarks(htmlContent)
      
      if (importedBookmarks.length === 0 && importedFolders.length === 0) {
        showMessage('未在文件中找到有效的书签', 'error')
        return
      }

      const existingUrls = new Set(bookmarks.map(b => b.url))
      const newBookmarks = importedBookmarks.filter(b => !existingUrls.has(b.url))
      
      const existingFolderKeys = new Set(folders.map(f => JSON.stringify({ title: f.title, path: f.path })))
      const newFolders = importedFolders.filter(f => !existingFolderKeys.has(JSON.stringify({ title: f.title, path: f.path })))

      if (newBookmarks.length === 0 && newFolders.length === 0) {
        showMessage('没有新的书签需要导入', 'info')
        return
      }

      importBookmarks(newBookmarks, newFolders)
      setShowImportModal(false)
      showMessage(`成功导入 ${newFolders.length} 个文件夹和 ${newBookmarks.length} 个书签`, 'success')
    } catch (err) {
      showMessage('导入失败，请确保选择正确的书签文件', 'error')
      console.error('Import error:', err)
    }
  }, [bookmarks, folders, importBookmarks, showMessage])

  const handleCloseImport = useCallback(() => {
    setShowImportModal(false)
  }, [])

  const handleExport = useCallback(() => {
    const htmlContent = exportBookmarks(folders, bookmarks)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=UTF-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bookmarks_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showMessage(`成功导出 ${folders.length} 个文件夹和 ${bookmarks.length} 个书签`, 'success')
  }, [folders, bookmarks, showMessage])

  const handleFolderClick = useCallback((folder) => {
    setCurrentPath(prev => [...prev, folder.title])
  }, [])

  const handleBack = useCallback(() => {
    setCurrentPath(prev => prev.slice(0, -1))
  }, [])

  const handleHome = useCallback(() => {
    setCurrentPath([])
  }, [])

  useEffect(() => {
    const pathString = window.location.pathname.slice(1)
    if (pathString) {
      try {
        const path = JSON.parse(decodeURIComponent(pathString))
        setCurrentPath(path)
      } catch {
        console.error('Failed to parse path from URL')
      }
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const pathString = window.location.pathname.slice(1)
      if (pathString) {
        try {
          const path = JSON.parse(decodeURIComponent(pathString))
          setCurrentPath(path)
        } catch {
          console.error('Failed to parse path from URL')
        }
      } else {
        setCurrentPath([])
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const pathString = window.location.pathname.slice(1)
    const expectedPath = currentPath.length > 0 ? encodeURIComponent(JSON.stringify(currentPath)) : ''
    
    if (pathString !== expectedPath) {
      const newPath = currentPath.length > 0 ? '/' + expectedPath : '/'
      window.history.pushState(null, '', newPath)
    }
  }, [currentPath])

  const handlePin = useCallback((bookmark) => {
    togglePinBookmark(bookmark.id)
  }, [togglePinBookmark])

  const handleCardActionsToggle = useCallback((bookmarkId) => {
    setActiveCardId(prev => prev === bookmarkId ? null : bookmarkId)
  }, [])

  const allItems = useMemo(() => {
    const items = []
    
    if (currentPath.length === 0) {
      const globalPinnedBookmarks = bookmarks.filter(b => b.isPinned)
      globalPinnedBookmarks.forEach(bookmark => {
        items.push({ type: 'bookmark', data: bookmark, isPinned: true })
      })
    }
    
    currentFolders.forEach(folder => {
      items.push({ type: 'folder', data: folder })
    })
    
    const pinnedBookmarks = currentBookmarks.filter(b => b.isPinned)
    const normalBookmarks = currentBookmarks.filter(b => !b.isPinned)
    
    pinnedBookmarks.forEach(bookmark => {
      items.push({ type: 'bookmark', data: bookmark })
    })
    normalBookmarks.forEach(bookmark => {
      items.push({ type: 'bookmark', data: bookmark })
    })
    
    return items
  }, [currentPath, bookmarks, currentFolders, currentBookmarks])

  const pinnedItems = useMemo(() => {
    return allItems.filter(item => item.isPinned)
  }, [allItems])

  const normalItems = useMemo(() => {
    return allItems.filter(item => !item.isPinned)
  }, [allItems])

  return (
    <div className="app">
      <Header 
        onAdd={handleAdd} 
        onImport={handleOpenImport}
        onExport={handleExport}
        onBack={currentPath.length > 0 ? handleBack : undefined}
        onHome={currentPath.length > 0 ? handleHome : undefined}
        currentPath={currentPath}
      />
      
      <main className="main-content">
        {!hasContent && pinnedItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>还没有书签</h3>
            <p>点击右上角按钮添加你的第一个书签吧</p>
          </div>
        ) : (
          <>
            {pinnedItems.length > 0 && (
              <div className="pinned-section">
                <div className="pinned-section-title">
                  <span className="pin-icon">📌</span>
                  <span>置顶书签</span>
                </div>
                <div 
                  className="pinned-grid"
                  style={{ 
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: isMobile ? '10px' : '16px'
                  }}
                >
                  {pinnedItems.map((item) => {
                    if (item.type === 'bookmark') {
                      return (
                        <BookmarkCard
                          key={item.data.id}
                          bookmark={item.data}
                          onEdit={handleEdit}
                          onDelete={deleteBookmark}
                          onPin={handlePin}
                          isMobile={isMobile}
                          showActions={activeCardId === item.data.id}
                          onActionsToggle={() => handleCardActionsToggle(item.data.id)}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}
            
            <div 
              className="bookmark-grid"
              style={{ 
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: isMobile ? '10px' : '16px'
              }}
            >
              {normalItems.map((item) => {
                if (item.type === 'folder') {
                  return (
                    <FolderCard
                      key={item.data.id}
                      folder={item.data}
                      onClick={handleFolderClick}
                      isMobile={isMobile}
                    />
                  )
                }
                return (
                  <BookmarkCard
                    key={item.data.id}
                    bookmark={item.data}
                    onEdit={handleEdit}
                    onDelete={deleteBookmark}
                    onPin={handlePin}
                    isMobile={isMobile}
                    showActions={activeCardId === item.data.id}
                    onActionsToggle={() => handleCardActionsToggle(item.data.id)}
                  />
                )
              })}
            </div>
          </>
        )}
      </main>

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImport}
          onCancel={handleCloseImport}
        />
      )}
    </div>
  )
}

export default App
