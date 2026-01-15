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
            const iconAttr = a.getAttribute('ICON')
            let icon = iconAttr || getIconForUrl(href)
            
            bookmarks.push({
              id: `bookmark_${bookmarks.length}_${now}`,
              title: title.trim(),
              url: href,
              icon,
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

async function exportBookmarks(folders: Folder[], bookmarks: Bookmark[]): Promise<string> {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.  It will be read and overwritten.
  DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`

  // 按parentId组织文件夹和书签
  async function buildHtml(parentId: string | null, level: number = 0): Promise<string> {
    let result = ''
    const indent = '  '.repeat(level + 1)
    
    // 处理当前父文件夹下的子文件夹
    const childFolders = folders.filter(folder => folder.parentId === parentId)
    for (const folder of childFolders) {
      result += `${indent}<DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">${escapeHtml(folder.title)}</H3>\n`
      result += `${indent}<DL><p>\n`
      result += await buildHtml(folder.id, level + 1)
      result += `${indent}</DL><p>\n`
    }
    
    // 处理当前父文件夹下的书签
    const childBookmarks = bookmarks.filter(bookmark => bookmark.parentId === parentId)
    for (const bookmark of childBookmarks) {
      const pinnedAttr = bookmark.isPinned ? ' CUSTOM_PINNED="true"' : ''
      let iconAttr = ''
      
      if (bookmark.icon) {
        if (bookmark.icon.startsWith('data:')) {
          // 如果已经是base64，直接使用
          iconAttr = ` ICON="${escapeHtml(bookmark.icon)}"`
        } else if (/^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]+$/u.test(bookmark.icon)) {
          // 如果是emoji，转换为base64
          const base64Icon = emojiToBase64(bookmark.icon)
          if (base64Icon) {
            iconAttr = ` ICON="${escapeHtml(base64Icon)}"`
          }
        } else {
          // 其他类型的图标，直接使用
          iconAttr = ` ICON="${escapeHtml(bookmark.icon)}"`
        }
      }
      
      result += `${indent}<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(Date.now() / 1000)}"${pinnedAttr}${iconAttr}>${escapeHtml(bookmark.title)}</A>\n`
    }
    
    return result
  }

  html += await buildHtml(null)
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
  return String(text).replace(/[&<>'"]/g, (m: string): string => map[m])
}

// 将emoji转换为base64图像
function emojiToBase64(emoji: string): string {
  // 创建一个canvas元素
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // 设置背景为白色
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 设置字体和绘制emoji
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
  
  // 转换为base64
  return canvas.toDataURL('image/png');
}

export { parseEdgeBookmarks, exportBookmarks }
