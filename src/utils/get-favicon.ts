// 获取网站favicon并转换为base64
export async function getFaviconBase64(url: string): Promise<string | null> {
  try {
    // 解析URL以获取主机名
    const parsedUrl = new URL(url)
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`
    
    // 尝试不同的favicon路径
    const faviconPaths = [
      '/favicon.ico',
      '/favicon.png',
      '/favicon.gif',
      '/favicon.jpg',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png'
    ]
    
    // 先尝试直接访问常见的favicon路径
    for (const path of faviconPaths) {
      const faviconUrl = `${baseUrl}${path}`
      try {
        const response = await fetch(faviconUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        })
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.startsWith('image/')) {
            const arrayBuffer = await response.arrayBuffer()
            const base64 = await arrayBufferToBase64(arrayBuffer)
            const base64Url = `data:${contentType};base64,${base64}`
            console.log('成功获取favicon (直接路径):', base64Url.substring(0, 100) + '...')
            return base64Url
          }
        }
      } catch (pathError) {
        console.log('尝试路径失败:', faviconUrl, pathError)
      }
    }
    
    // 如果直接路径失败，尝试解析HTML页面中的link标签
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        const html = await response.text()
        const faviconUrlFromHtml = extractFaviconUrlFromHtml(html, baseUrl)
        
        if (faviconUrlFromHtml) {
          const faviconResponse = await fetch(faviconUrlFromHtml, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          })
          
          if (faviconResponse.ok) {
            const contentType = faviconResponse.headers.get('content-type')
            if (contentType && contentType.startsWith('image/')) {
              const arrayBuffer = await faviconResponse.arrayBuffer()
              const base64 = await arrayBufferToBase64(arrayBuffer)
              const base64Url = `data:${contentType};base64,${base64}`
              console.log('成功获取favicon (HTML解析):', base64Url.substring(0, 100) + '...')
              return base64Url
            }
          }
        }
      }
    } catch (htmlError) {
      console.error('解析HTML失败:', htmlError)
    }
    
    console.log('所有favicon获取方法都失败了')
    return null
  } catch (error) {
    console.error('获取favicon失败:', error)
    return null
  }
}

// 从HTML中提取favicon URL
function extractFaviconUrlFromHtml(html: string, baseUrl: string): string | null {
  // 匹配link标签中的favicon
  const linkTagRegex = /<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["'][^>]*>/gi
  let match
  
  while ((match = linkTagRegex.exec(html)) !== null) {
    let faviconUrl = match[1]
    
    // 处理协议相对URL (//开头)
    if (faviconUrl.startsWith('//')) {
      // 使用baseUrl的协议部分加上相对URL
      const protocol = baseUrl.startsWith('https://') ? 'https:' : 'http:'
      faviconUrl = `${protocol}${faviconUrl}`
    } 
    // 处理绝对路径 (以/开头)
    else if (faviconUrl.startsWith('/')) {
      faviconUrl = `${baseUrl}${faviconUrl}`
    }
    // 处理相对路径
    else if (!faviconUrl.startsWith('http://') && !faviconUrl.startsWith('https://')) {
      faviconUrl = `${baseUrl}/${faviconUrl}`
    }
    
    return faviconUrl
  }
  
  // 匹配apple-touch-icon
  const appleTouchIconRegex = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["'][^>]*>/gi
  
  while ((match = appleTouchIconRegex.exec(html)) !== null) {
    let faviconUrl = match[1]
    
    // 处理协议相对URL (//开头)
    if (faviconUrl.startsWith('//')) {
      // 使用baseUrl的协议部分加上相对URL
      const protocol = baseUrl.startsWith('https://') ? 'https:' : 'http:'
      faviconUrl = `${protocol}${faviconUrl}`
    } 
    // 处理绝对路径 (以/开头)
    else if (faviconUrl.startsWith('/')) {
      faviconUrl = `${baseUrl}${faviconUrl}`
    }
    // 处理相对路径
    else if (!faviconUrl.startsWith('http://') && !faviconUrl.startsWith('https://')) {
      faviconUrl = `${baseUrl}/${faviconUrl}`
    }
    
    return faviconUrl
  }
  
  return null
}

// 将ArrayBuffer转换为base64
function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve) => {
    const blob = new Blob([buffer], { type: 'image/x-icon' })
    const reader = new FileReader()
    
    reader.onloadend = () => {
      const base64data = reader.result as string
      // 移除data URL的头部，只保留base64部分
      resolve(base64data.split(',')[1])
    }
    
    reader.readAsDataURL(blob)
  })
}
