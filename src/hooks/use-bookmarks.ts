import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Bookmark, Folder, UseBookmarksReturn } from '../types'

const STORAGE_KEY = 'bookmark-tool-data'

const defaultBookmarks: Bookmark[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com', icon: '🔍', color: '#4285f4', isPinned: false, createdAt: Date.now(), parentId: null, path: [] },
  { id: '2', title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#24292e', isPinned: false, createdAt: Date.now(), parentId: null, path: [] },
  { id: '3', title: 'YouTube', url: 'https://www.youtube.com', icon: '📺', color: '#ff0000', isPinned: false, createdAt: Date.now(), parentId: null, path: [] },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', icon: '🐦', color: '#1da1f2', isPinned: false, createdAt: Date.now(), parentId: null, path: [] },
  { id: '5', title: 'Notion', url: 'https://www.notion.so', icon: '📝', color: '#000000', isPinned: false, createdAt: Date.now(), parentId: null, path: [] },
  { id: '6', title: 'Figma', url: 'https://www.figma.com', icon: '🎨', color: '#f24e1e', isPinned: false, createdAt: Date.now(), parentId: null, path: [] }
]

const defaultFolders: Folder[] = []

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>((): Bookmark[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.bookmarks || defaultBookmarks
      }
    } catch {}
    return defaultBookmarks
  })

  const [folders, setFolders] = useState<Folder[]>((): Folder[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.folders || defaultFolders
      }
    } catch {}
    return defaultFolders
  })

  useEffect((): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarks, folders }))
  }, [bookmarks, folders])

  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: uuidv4(),
      createdAt: Date.now()
    }
    setBookmarks((prev: Bookmark[]): Bookmark[] => [newBookmark, ...prev])
    return newBookmark
  }, [])

  const updateBookmark = useCallback((id: string, updates: Partial<Bookmark>): void => {
    setBookmarks((prev: Bookmark[]): Bookmark[] => prev.map((b: Bookmark): Bookmark => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const deleteBookmark = useCallback((id: string): void => {
    setBookmarks((prev: Bookmark[]): Bookmark[] => prev.filter((b: Bookmark): boolean => b.id !== id))
  }, [])

  const reorderBookmarks = useCallback((newOrder: Bookmark[]): void => {
    setBookmarks(newOrder)
  }, [])

  const togglePinBookmark = useCallback((id: string): void => {
    setBookmarks((prev: Bookmark[]): Bookmark[] => prev.map((b: Bookmark): Bookmark => {
      if (b.id === id) {
        return { ...b, isPinned: !b.isPinned }
      }
      return b
    }))
  }, [])

  const addFolder = useCallback((folder: Omit<Folder, 'id'>): Folder => {
    const newFolder: Folder = {
      ...folder,
      id: uuidv4()
    }
    setFolders((prev: Folder[]): Folder[] => [...prev, newFolder])
    return newFolder
  }, [])

  const importBookmarks = useCallback((importedBookmarks: Bookmark[], importedFolders?: Folder[]): void => {
    setBookmarks((prev: Bookmark[]): Bookmark[] => {
      const existingUrls = new Set(prev.map((b: Bookmark): string => b.url))
      const newBookmarks = importedBookmarks.filter((b: Bookmark): boolean => !existingUrls.has(b.url))
      return [...prev, ...newBookmarks]
    })
    if (importedFolders && importedFolders.length > 0) {
      setFolders((prev: Folder[]): Folder[] => {
        const existingFolderKeys = new Set(prev.map((f: Folder): string => JSON.stringify({ title: f.title, path: f.path })))
        const newFolders = importedFolders.filter((f: Folder): boolean => !existingFolderKeys.has(JSON.stringify({ title: f.title, path: f.path })))
        return [...prev, ...newFolders]
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
