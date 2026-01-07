import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'bookmark-tool-data'

const defaultBookmarks = [
  { id: '1', title: 'Google', url: 'https://www.google.com', icon: '🔍', color: '#4285f4', isPinned: false, createdAt: Date.now() },
  { id: '2', title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#24292e', isPinned: false, createdAt: Date.now() },
  { id: '3', title: 'YouTube', url: 'https://www.youtube.com', icon: '📺', color: '#ff0000', isPinned: false, createdAt: Date.now() },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', icon: '🐦', color: '#1da1f2', isPinned: false, createdAt: Date.now() },
  { id: '5', title: 'Notion', url: 'https://www.notion.so', icon: '📝', color: '#000000', isPinned: false, createdAt: Date.now() },
  { id: '6', title: 'Figma', url: 'https://www.figma.com', icon: '🎨', color: '#f24e1e', isPinned: false, createdAt: Date.now() }
]

const defaultFolders = []

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.bookmarks || defaultBookmarks
      }
    } catch {}
    return defaultBookmarks
  })

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.folders || defaultFolders
      }
    } catch {}
    return defaultFolders
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarks, folders }))
  }, [bookmarks, folders])

  const addBookmark = useCallback((bookmark) => {
    const newBookmark = {
      ...bookmark,
      id: uuidv4(),
      createdAt: Date.now()
    }
    setBookmarks(prev => [newBookmark, ...prev])
    return newBookmark
  }, [])

  const updateBookmark = useCallback((id, updates) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const deleteBookmark = useCallback((id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  const reorderBookmarks = useCallback((newOrder) => {
    setBookmarks(newOrder)
  }, [])

  const togglePinBookmark = useCallback((id) => {
    setBookmarks(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, isPinned: !b.isPinned }
      }
      return b
    }))
  }, [])

  const addFolder = useCallback((folder) => {
    const newFolder = {
      ...folder,
      id: uuidv4()
    }
    setFolders(prev => [...prev, newFolder])
    return newFolder
  }, [])

  const importBookmarks = useCallback((importedBookmarks, importedFolders) => {
    setBookmarks(prev => {
      const existingUrls = new Set(prev.map(b => b.url))
      const newBookmarks = importedBookmarks.filter(b => !existingUrls.has(b.url))
      return [...newBookmarks, ...prev]
    })
    if (importedFolders && importedFolders.length > 0) {
      setFolders(prev => {
        const existingFolderKeys = new Set(prev.map(f => JSON.stringify({ title: f.title, path: f.path })))
        const newFolders = importedFolders.filter(f => !existingFolderKeys.has(JSON.stringify({ title: f.title, path: f.path })))
        return [...newFolders, ...prev]
      })
    }
  }, [])

  return {
    bookmarks,
    folders,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    togglePinBookmark,
    addFolder,
    importBookmarks
  }
}
