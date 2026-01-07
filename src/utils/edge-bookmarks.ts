import { Bookmark, Folder } from '../types'

interface ParsedData {
  folders: Folder[];
  bookmarks: Bookmark[];
}

function parseEdgeBookmarks(htmlContent: string): ParsedData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const folders: Folder[] = []
  const bookmarks: Bookmark[] = []
  const now = Date.now()
  
  function parseContents(element: Element, parentFolderId: string | null, parentPath: string[]): void {
    const children = element.children
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Element
      
      if (child.tagName === 'DT') {
        const h3 = child.querySelector('h3')
        const a = child.querySelector('a')
        
        if (h3) {
          const folderName = h3.textContent || ''
          const dl = h3.nextElementSibling
          
          if (folderName && dl && dl.tagName === 'DL') {
            const folderId = `folder_${folders.length}_${now}`
            const folderPath = [...parentPath, folderName]
            
            folders.push({
              id: folderId,
              title: folderName,
              parentId: parentFolderId,
              path: folderPath
            })
            
            parseContents(dl, folderId, folderPath)
          }
        } else if (a) {
          const title = a.textContent || ''
          const href = a.getAttribute('href') || ''
          
          if (href) {
            const isPinned = a.getAttribute('CUSTOM_PINNED') === 'true'
            
            bookmarks.push({
              id: `bookmark_${bookmarks.length}_${now}`,
              title: title.trim(),
              url: href,
              icon: getIconForUrl(href),
              color: getColorForUrl(href),
              parentId: parentFolderId,
              path: [...parentPath],
              isPinned
            })
          }
        }
      }
    }
  }
  
  const rootDl = doc.querySelector('dl')
  if (rootDl) {
    parseContents(rootDl, null, [])
  }
  
  return { folders, bookmarks }
}

function exportBookmarks(folders: Folder[], bookmarks: Bookmark[]): string {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.  It will be read and overwritten.
  DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`

  const bookmarksByPath = new Map<string, Bookmark[]>()
  const foldersByPath = new Map<string, Folder[]>()

  bookmarks.forEach(bookmark => {
    const pathKey = JSON.stringify(bookmark.path)
    if (!bookmarksByPath.has(pathKey)) {
      bookmarksByPath.set(pathKey, [])
    }
    bookmarksByPath.get(pathKey)!.push(bookmark)
  })

  folders.forEach(folder => {
    const pathKey = JSON.stringify(folder.path)
    if (!foldersByPath.has(pathKey)) {
      foldersByPath.set(pathKey, [])
    }
    foldersByPath.get(pathKey)!.push(folder)
  })

  function buildHtml(path: string[], level: number = 0): string {
    let result = ''
    const indent = '  '.repeat(level + 1)
    const pathKey = JSON.stringify(path)
    
    const currentFolders = foldersByPath.get(pathKey) || []
    for (const folder of currentFolders) {
      result += `${indent}<DT><H3>${escapeHtml(folder.title)}</H3>\n`
      result += `${indent}<DL><p>\n`
      result += buildHtml([...path, folder.title], level + 1)
      result += `${indent}</DL><p>\n`
    }
    
    const childBookmarks = bookmarksByPath.get(pathKey) || []
    for (const bookmark of childBookmarks) {
      const pinnedAttr = bookmark.isPinned ? ' CUSTOM_PINNED="true"' : ''
      result += `${indent}<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(Date.now() / 1000)}"${pinnedAttr}>${escapeHtml(bookmark.title)}</A>\n`
    }
    
    return result
  }

  html += buildHtml([])
  html += `</DL><p>`
  
  return html
}

function getIconForUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.charAt(0).toUpperCase()
  } catch {
    return '📌'
  }
}

function getColorForUrl(url: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ]

  try {
    const hostname = new URL(url).hostname
    let hash = 0
    for (let i = 0; i < hostname.length; i++) {
      hash = ((hash << 5) - hash) + hostname.charCodeAt(i)
      hash = hash & hash
    }
    return colors[Math.abs(hash) % colors.length]
  } catch {
    return colors[0]
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, (m: string): string => map[m])
}

export { parseEdgeBookmarks, exportBookmarks }
