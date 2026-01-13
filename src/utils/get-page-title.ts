// 从URL获取页面标题
import logger from './logger'

export async function getPageTitle(url: string): Promise<string | null> {
  try {
    // 发送请求获取页面HTML
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })
    
    // 检查响应是否成功
    if (!response.ok) {
      logger.error('页面请求失败，状态码:', response.status)
      return null
    }
    
    // 获取HTML内容
    const html = await response.text()
    
    // 从HTML中提取标题
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    
    if (titleMatch && titleMatch[1]) {
      // 清理标题文本，移除多余空格和换行符
      const title = titleMatch[1].trim().replace(/\s+/g, ' ')
      logger.log('成功获取页面标题:', title)
      return title
    } else {
      logger.log('未找到页面标题')
      return null
    }
  } catch (error) {
    logger.error('获取页面标题失败:', error)
    return null
  }
}