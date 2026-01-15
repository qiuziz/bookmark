import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Bookmark, Folder, UseBookmarksReturn } from '../types'
import { FileStorage } from '../utils/file-storage'

const STORAGE_KEY = 'bookmark-tool-data'

const defaultBookmarks: Bookmark[] = []

const defaultFolders: Folder[] = []

export function useBookmarks(): UseBookmarksReturn & {
  isFileStorageSupported: boolean;
  isFileStorageAuthorized: boolean;
  requestFileStorageAuthorization: () => Promise<boolean>;
  backupData: () => Promise<boolean>;
  importFromFile: () => Promise<void>;
} {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(defaultBookmarks)
  const [folders, setFolders] = useState<Folder[]>(defaultFolders)
  const [isFileStorageAuthorized, setIsFileStorageAuthorized] = useState<boolean>(false)
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true)
  const storage = FileStorage.getInstance()

  // 从本地存储或文件加载数据
  useEffect((): void => {
    // 标记是否已经加载过数据，避免重复加载
    let hasLoaded = false
    
    const loadData = async (): Promise<void> => {
      // 防止重复执行
      if (hasLoaded) return
      hasLoaded = true
      
      try {
        console.log('开始加载数据...')
        
        // 首先检查localStorage是否有数据
        const saved = localStorage.getItem(STORAGE_KEY)
        console.log('localStorage中的数据:', saved)
        
        // 优先从文件加载数据
        if (await storage.isAuthorized()) {
          console.log('文件存储已授权，尝试从文件加载数据...')
          const fileData = await storage.readData()
          if (fileData) {
            // 使用更安全的方式处理空数组，避免空数组被默认数据替换
            const bookmarksFromFile = Array.isArray(fileData.bookmarks) ? fileData.bookmarks : defaultBookmarks
            const foldersFromFile = Array.isArray(fileData.folders) ? fileData.folders : defaultFolders
            
            setBookmarks(bookmarksFromFile)
            setFolders(foldersFromFile)
            setIsFileStorageAuthorized(true)
            console.log('数据已从文件加载:', { bookmarks: bookmarksFromFile, folders: foldersFromFile })
            
            // 同时更新localStorage
            const dataToSave = { bookmarks: bookmarksFromFile, folders: foldersFromFile }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
            console.log('已更新localStorage')
            return
          } else {
            console.log('文件中没有数据')
          }
        }

        // 如果文件加载失败或未授权，从localStorage加载
        if (saved) {
          console.log('从localStorage加载数据...')
          try {
            const data = JSON.parse(saved)
            // 使用更安全的方式处理空数组，避免空数组被默认数据替换
            const bookmarksFromStorage = Array.isArray(data.bookmarks) ? data.bookmarks : defaultBookmarks
            const foldersFromStorage = Array.isArray(data.folders) ? data.folders : defaultFolders
            
            setBookmarks(bookmarksFromStorage)
            setFolders(foldersFromStorage)
            console.log('数据已从localStorage加载:', { bookmarks: bookmarksFromStorage, folders: foldersFromStorage })
          } catch (parseError) {
            console.error('解析localStorage数据失败:', parseError)
            // 如果解析失败，使用默认数据
            setBookmarks(defaultBookmarks)
            setFolders(defaultFolders)
            console.log('使用默认数据')
          }
        } else {
          // 如果localStorage也没有数据，使用默认数据
          setBookmarks(defaultBookmarks)
          setFolders(defaultFolders)
          console.log('使用默认数据')
        }

        // 检查文件存储是否已授权
        setIsFileStorageAuthorized(await storage.isAuthorized())
        // 设置为非首次加载
        setIsFirstLoad(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        // 发生错误时，使用默认数据
        setBookmarks(defaultBookmarks)
        setFolders(defaultFolders)
        // 设置为非首次加载
        setIsFirstLoad(false)
      }
    }

    // 立即加载数据
    loadData()
  }, [])

  // 保存数据到localStorage和文件
  useEffect((): void => {
    const saveData = async (): Promise<void> => {
      try {
        // 只有在非首次加载时才保存数据，避免覆盖用户之前的数据
        if (isFirstLoad) {
          console.log('首次加载，跳过保存默认数据')
          return
        }
        
        const data = { bookmarks, folders }
        // 保存到localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        console.log('数据已保存到localStorage:', data)
        // 如果已授权，保存到文件
        if (isFileStorageAuthorized) {
          await storage.writeData(data)
          console.log('数据已保存到文件')
        }
      } catch (error) {
        console.error('Failed to save data:', error)
      }
    }

    saveData()
  }, [bookmarks, folders, isFileStorageAuthorized, isFirstLoad])

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

  const updateFolder = useCallback((id: string, updates: Partial<Folder>): void => {
    setFolders((prev: Folder[]): Folder[] => prev.map((f: Folder): Folder => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const deleteFolder = useCallback((id: string): void => {
    setFolders((prev: Folder[]): Folder[] => prev.filter((f: Folder): boolean => f.id !== id))
    setBookmarks((prev: Bookmark[]): Bookmark[] => prev.filter((b: Bookmark): boolean => b.parentId !== id))
  }, [])

  const importBookmarks = useCallback((importedBookmarks: Bookmark[], importedFolders?: Folder[]): void => {
    console.log('开始导入书签...')
    console.log('原始书签数量:', bookmarks.length)
    console.log('原始文件夹数量:', folders.length)
    console.log('要导入的书签数量:', importedBookmarks.length)
    console.log('要导入的文件夹数量:', importedFolders?.length || 0)
    
    // 更新书签
    const updatedBookmarks = [...bookmarks, ...importedBookmarks.filter((b: Bookmark): boolean => {
      return !bookmarks.some((existing: Bookmark): boolean => existing.url === b.url)
    })]
    setBookmarks(updatedBookmarks)
    
    // 更新文件夹
    let updatedFolders = [...folders]
    if (importedFolders && importedFolders.length > 0) {
      const existingFolderKeys = new Set(folders.map((f: Folder): string => JSON.stringify({ title: f.title, path: f.path })))
      const newFolders = importedFolders.filter((f: Folder): boolean => !existingFolderKeys.has(JSON.stringify({ title: f.title, path: f.path })))
      updatedFolders = [...folders, ...newFolders]
      setFolders(updatedFolders)
    }
    
    console.log('更新后的书签数量:', updatedBookmarks.length)
    console.log('更新后的文件夹数量:', updatedFolders.length)
    
    // 立即保存到localStorage，确保数据不会丢失
    const dataToSave = { bookmarks: updatedBookmarks, folders: updatedFolders }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    console.log('导入的数据已立即保存到localStorage:', dataToSave)
    
    // 如果已授权，保存到文件
    if (isFileStorageAuthorized) {
      storage.writeData(dataToSave)
        .then((success: boolean): void => {
          if (success) {
            console.log('导入的数据已保存到文件')
          } else {
            console.error('保存到文件失败')
          }
        })
    }
  }, [bookmarks, folders, isFileStorageAuthorized, storage])

  // 请求文件存储授权
  const requestFileStorageAuthorization = useCallback(async (): Promise<boolean> => {
    if (!storage.isSupported()) {
      return false
    }
    const authorized = await storage.requestAuthorization()
    setIsFileStorageAuthorized(authorized)
    return authorized
  }, [storage])

  // 手动备份数据
  const backupData = useCallback(async (): Promise<boolean> => {
    if (!isFileStorageAuthorized) {
      return false
    }
    return await storage.backupData()
  }, [isFileStorageAuthorized, storage])

  // 从文件导入数据
  const importFromFile = useCallback(async (): Promise<void> => {
    try {
      console.log('开始从文件导入数据...')
      const importedData = await storage.importFromFile()
      if (importedData) {
        console.log('导入的数据:', importedData)
        
        // 确保导入的数据结构正确
        const bookmarksToImport = importedData.bookmarks || []
        const foldersToImport = importedData.folders || []
        
        console.log('要导入的书签:', bookmarksToImport)
        console.log('要导入的文件夹:', foldersToImport)
        
        // 更新state
        setBookmarks(bookmarksToImport)
        setFolders(foldersToImport)
        
        // 立即保存到localStorage，确保数据不会丢失
        const dataToSave = { bookmarks: bookmarksToImport, folders: foldersToImport }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
        console.log('数据已立即保存到localStorage:', dataToSave)
        
        // 如果已授权，保存到文件
        if (isFileStorageAuthorized) {
          await storage.writeData(dataToSave)
          console.log('数据已保存到文件')
        }
      } else {
        console.log('没有导入到任何数据')
      }
    } catch (error) {
      console.error('Failed to import data from file:', error)
    }
  }, [storage, isFileStorageAuthorized])

  return {
    bookmarks,
    folders,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    togglePinBookmark,
    addFolder,
    updateFolder,
    deleteFolder,
    importBookmarks,
    isFileStorageSupported: storage.isSupported(),
    isFileStorageAuthorized,
    requestFileStorageAuthorization,
    backupData,
    importFromFile
  }
}
