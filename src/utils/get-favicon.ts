// 获取网站favicon并转换为base64
import logger from './logger'

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
          // 严格检查响应头的content-type是否为图像类型
          const contentType = response.headers.get('content-type')
          logger.log(`直接路径 ${path} 的favicon响应类型:`, contentType)
          
          if (contentType && contentType.startsWith('image/')) {
            const arrayBuffer = await response.arrayBuffer()
            const base64 = await arrayBufferToBase64(arrayBuffer)
            
            // 检查base64是否为空
            if (base64) {
              const base64Url = `data:${contentType};base64,${base64}`
              logger.log('成功获取favicon (直接路径):', base64Url.substring(0, 100) + '...')
              return base64Url
            } else {
              logger.log(`直接路径 ${path} 的favicon转换为base64失败，结果为空`)
            }
          } else {
            logger.log(`直接路径 ${path} 的favicon不是有效的图像类型:`, contentType)
          }
        } else {
          logger.log(`直接路径 ${path} 的favicon请求失败:`, response.status)
        }
      } catch (pathError) {
          logger.log('尝试路径失败:', faviconUrl, pathError)
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
          try {
            const faviconResponse = await fetch(faviconUrlFromHtml, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache',
              // 设置超时，避免请求阻塞
              signal: AbortSignal.timeout(5000)
            })
            
            if (faviconResponse.ok) {
              // 严格检查响应头的content-type是否为图像类型
              const contentType = faviconResponse.headers.get('content-type')
              logger.log('从HTML提取的favicon响应类型:', contentType)
              
              if (contentType && contentType.startsWith('image/')) {
                const arrayBuffer = await faviconResponse.arrayBuffer()
                const base64 = await arrayBufferToBase64(arrayBuffer)
                
                // 检查base64是否为空
                if (base64) {
                  const base64Url = `data:${contentType};base64,${base64}`
                  logger.log('成功获取favicon (HTML解析):', base64Url.substring(0, 100) + '...')
                  return base64Url
                } else {
                  logger.log('从HTML提取的favicon转换为base64失败，结果为空')
                }
              } else {
                logger.log('从HTML提取的favicon不是有效的图像类型:', contentType)
              }
            } else {
              logger.log('从HTML提取的favicon请求失败:', faviconResponse.status)
            }
          } catch (faviconFetchError) {
            logger.error('获取从HTML提取的favicon失败:', faviconFetchError)
          }
        }
      }
    } catch (htmlError) {
      logger.error('解析HTML失败:', htmlError)
    }
    
    logger.log('所有favicon获取方法都失败了')
    return null
  } catch (error) {
    logger.error('获取favicon失败:', error)
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
function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string | null> {
  return new Promise((resolve) => {
    // 检查buffer是否为空
    if (buffer.byteLength === 0) {
      logger.log('ArrayBuffer为空，无法转换为base64')
      resolve(null)
      return
    }
    
    const blob = new Blob([buffer], { type: 'image/x-icon' })
    const reader = new FileReader()
    
    reader.onloadend = () => {
      try {
        const base64data = reader.result as string
        // 移除data URL的头部，只保留base64部分
        const base64 = base64data.split(',')[1]
        
        // 检查base64是否为空
        if (!base64) {
          logger.log('base64转换失败，结果为空')
          resolve(null)
          return
        }
        
        resolve(base64)
      } catch (error) {
        logger.error('base64转换过程中发生错误:', error)
        resolve(null)
      }
    }
    
    reader.readAsDataURL(blob)
  })
}
