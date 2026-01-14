import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/home'
import { MessageProvider } from './components/message'
import { getCurrentWallpaper, applyWallpaper } from './utils/wallpapers'
import './styles/index.scss'

// 初始化壁纸
const initializeWallpaper = async () => {
  try {
    // 优先使用保存的壁纸
    const savedWallpaper = getCurrentWallpaper()
    applyWallpaper(savedWallpaper)
    
    // 如果是默认壁纸，自动获取Bing壁纸
    if (savedWallpaper.id === 'default') {
      try {
        const { getBingWallpapers } = await import('./utils/wallpapers')
        const wallpapers = await getBingWallpapers(1)
        if (wallpapers.length > 1) {
          const bingWallpaper = wallpapers[1] // 获取第一张Bing壁纸
          const { setWallpaper } = await import('./utils/wallpapers')
          setWallpaper(bingWallpaper)
          applyWallpaper(bingWallpaper)
        }
      } catch (error) {
        console.error('自动获取Bing壁纸失败，使用默认壁纸:', error)
        // 失败时保持默认壁纸，不影响应用启动
      }
    }
  } catch (error) {
    console.error('初始化壁纸失败:', error)
  }
}

// 在DOM加载完成后初始化壁纸，确保插件模式下也能正常工作
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWallpaper)
} else {
  initializeWallpaper()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MessageProvider>
      <Home />
    </MessageProvider>
  </React.StrictMode>
)
