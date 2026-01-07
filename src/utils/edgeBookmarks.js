function parseEdgeBookmarks(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const folders = []
  const bookmarks = []
  const now = Date.now()
  
  function parseDl(dl, parentFolderId, parentPath) {
    const dt = dl.previousElementSibling
    let currentFolderId = parentFolderId
    let currentFolderPath = [...parentPath]
    
    if (dt && dt.tagName === 'DT') {
      const h3 = dt.querySelector('h3')
      if (h3) {
        const folderName = h3.textContent || ''
        if (folderName) {
          currentFolderId = `folder_${folders.length}_${now}`
          currentFolderPath = [...parentPath, folderName]
          
          const newFolder = {
            id: currentFolderId,
            title: folderName,
            parentId: parentFolderId,
            path: currentFolderPath
          }
          folders.push(newFolder)
        }
      }
    }
    
    const children = Array.from(dl.children)
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      
      if (child.tagName === 'DT') {
        const nextSibling = child.nextElementSibling
        
        if (nextSibling && nextSibling.tagName === 'DL') {
          parseDl(nextSibling, currentFolderId, currentFolderPath)
          i++
        } else {
          const a = child.querySelector('a')
          if (a) {
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
                parentId: currentFolderId,
                path: currentFolderPath,
                isPinned
              })
            }
          }
        }
      }
    }
  }
  
  const dlElements = doc.querySelectorAll('dl')
  
  const topLevelDlElements = Array.from(dlElements).filter(dl => {
    const parent = dl.parentElement
    return parent && parent.tagName !== 'DT' && parent.tagName !== 'DL'
  })
  
  for (const dl of topLevelDlElements) {
    parseDl(dl, null, [])
  }
  
  return { folders, bookmarks }
}

function exportBookmarks(folders, bookmarks) {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.  It will be read and overwritten.
  DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`

  const bookmarksByPath = new Map()
  const foldersByPath = new Map()

  bookmarks.forEach(bookmark => {
    const pathKey = JSON.stringify(bookmark.path)
    if (!bookmarksByPath.has(pathKey)) {
      bookmarksByPath.set(pathKey, [])
    }
    bookmarksByPath.get(pathKey).push(bookmark)
  })

  folders.forEach(folder => {
    const pathKey = JSON.stringify(folder.path)
    if (!foldersByPath.has(pathKey)) {
      foldersByPath.set(pathKey, [])
    }
    foldersByPath.get(pathKey).push(folder)
  })

  function buildHtml(path, level = 0) {
    let result = ''
    const indent = '  '.repeat(level + 1)
    const pathKey = JSON.stringify(path)
    
    const currentFolders = foldersByPath.get(pathKey) || []
    for (const folder of currentFolders) {
      result += `${indent}<DT><H3>${escapeHtml(folder.title)}</H3>
`
      result += `${indent}<DL><p>
`
      result += buildHtml([...path, folder.title], level + 1)
      result += `${indent}</DL><p>
`
    }
    
    const childBookmarks = bookmarksByPath.get(pathKey) || []
    for (const bookmark of childBookmarks) {
      const pinnedAttr = bookmark.isPinned ? ' CUSTOM_PINNED="true"' : ''
      result += `${indent}<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(Date.now() / 1000)}"${pinnedAttr}>${escapeHtml(bookmark.title)}</A>
`
    }
    
    return result
  }

  html += buildHtml([])
  html += `</DL><p>`
  
  return html
}

function getIconForUrl(url) {
  try {
    const hostname = new URL(url).hostname
    return hostname.charAt(0).toUpperCase()
  } catch {
    return '📌'
  }
}

function getColorForUrl(url) {
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

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, m => map[m])
}

export { parseEdgeBookmarks, exportBookmarks }
