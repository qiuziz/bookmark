import { Wallpaper } from '../types'
import logger from './logger'

// Bing官方壁纸API地址
const BING_OFFICIAL_API = 'https://cn.bing.com/HPImageArchive.aspx'

// 默认壁纸
const defaultWallpaper: Wallpaper = {
  id: 'default',
  name: '默认背景',
  path: ''
}

// 缓存的壁纸列表
let cachedWallpapers: Wallpaper[] = [defaultWallpaper]

// 获取所有壁纸（包含默认和随机获取的）
export const getAllWallpapers = (): Wallpaper[] => {
  return cachedWallpapers
}

// 获取当前壁纸
export const getCurrentWallpaper = (): Wallpaper => {
  try {
    const savedId = localStorage.getItem('wallpaperId')
    if (savedId === defaultWallpaper.id) {
      return defaultWallpaper
    }
    // 如果是Bing壁纸，返回保存的路径
    const savedPath = localStorage.getItem('wallpaperPath')
    const savedName = localStorage.getItem('wallpaperName')
    if (savedPath) {
      return {
        id: 'bing-random',
        name: savedName || 'Bing壁纸',
        path: savedPath
      }
    }
  } catch (error) {
    logger.error('Failed to get current wallpaper from localStorage:', error)
  }
  return defaultWallpaper
}

// 设置壁纸
export const setWallpaper = (wallpaper: Wallpaper): void => {
  try {
    if (wallpaper.id === defaultWallpaper.id) {
      localStorage.setItem('wallpaperId', wallpaper.id)
      localStorage.removeItem('wallpaperPath')
      localStorage.removeItem('wallpaperName')
    } else {
      localStorage.setItem('wallpaperId', 'bing-random')
      localStorage.setItem('wallpaperPath', wallpaper.path)
      localStorage.setItem('wallpaperName', wallpaper.name)
    }
  } catch (error) {
    logger.error('Failed to save wallpaper to localStorage:', error)
  }
}

// 应用壁纸到DOM
export const applyWallpaper = (wallpaper: Wallpaper): void => {
  const root = document.getElementById('root')
  if (!root) return

  if (wallpaper.id === defaultWallpaper.id) {
    root.style.background = '#f5f7fa'
    root.style.backgroundImage = 'none'
    root.style.backgroundSize = 'cover'
    root.style.backgroundPosition = 'center'
    root.style.backgroundRepeat = 'no-repeat'
    root.style.backdropFilter = 'none'
  } else {
    root.style.background = 'transparent'
    root.style.backgroundImage = `url('${wallpaper.path}')`
    root.style.backgroundSize = 'cover'
    root.style.backgroundPosition = 'center'
    root.style.backgroundRepeat = 'no-repeat'
    // 移除背景图上的模糊效果，仅保留卡片和header的高斯模糊
    root.style.backdropFilter = 'none'
  }
}

// 获取Bing壁纸列表
export const getBingWallpapers = async (count: number = 5): Promise<Wallpaper[]> => {
  try {
    // 使用必应官方API获取壁纸列表
    const response = await fetch(`${BING_OFFICIAL_API}?format=js&idx=0&n=${count}&mkt=zh-CN`)
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    const images = data.images || []
    
    const wallpapers: Wallpaper[] = [defaultWallpaper]
    
    // 处理获取到的壁纸数据
    images.forEach((image: any, index: number) => {
      // 构建完整的图片URL
      const imageUrl = `https://cn.bing.com${image.url}`
      const imageName = image.copyright || `Bing壁纸 ${index + 1}`
      
      wallpapers.push({
        id: `bing-${index}`,
        name: imageName,
        path: imageUrl
      })
    })
    
    cachedWallpapers = wallpapers
    return wallpapers
  } catch (error) {
    logger.error('获取Bing壁纸失败:', error)
    return [defaultWallpaper]
  }
}

// 重置壁纸到默认
export const resetWallpaper = (): void => {
  setWallpaper(defaultWallpaper)
  applyWallpaper(defaultWallpaper)
}
