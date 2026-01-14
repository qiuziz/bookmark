import { useState, useEffect, ReactElement } from 'react'
import { Wallpaper } from '../../types'
import { getBingWallpapers, getCurrentWallpaper, setWallpaper, applyWallpaper } from '../../utils/wallpapers'
import logger from '../../utils/logger'
import './index.scss'

interface WallpaperSelectorProps {
  onClose: () => void
}

function WallpaperSelector({ onClose }: WallpaperSelectorProps): ReactElement {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const loadWallpapers = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      // 从Bing API获取壁纸数据
      const fetchedWallpapers = await getBingWallpapers(5)
      setWallpapers(fetchedWallpapers)
    } catch (err) {
      logger.error('加载壁纸失败:', err)
      setError('加载壁纸失败，请稍后重试')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const refreshWallpapers = async (): Promise<void> => {
    setRefreshing(true)
    await loadWallpapers()
  }

  useEffect((): void => {
    // 加载壁纸数据
    loadWallpapers()

    // 获取当前选中的壁纸
    const currentWallpaper = getCurrentWallpaper()
    setSelectedWallpaper(currentWallpaper.id)
  }, [])

  const handleWallpaperSelect = (wallpaperId: string): void => {
    try {
      const wallpaper = wallpapers.find(w => w.id === wallpaperId)
      if (!wallpaper) return

      setSelectedWallpaper(wallpaperId)
      setWallpaper(wallpaper)
      applyWallpaper(wallpaper)
    } catch (error) {
      logger.error('Failed to select wallpaper:', error)
    }
  }

  const handleClose = (): void => {
    onClose()
  }

  return (
    <div className="wallpaper-selector-overlay">
      <div className="wallpaper-selector">
        <div className="wallpaper-selector-header">
          <h2>选择壁纸</h2>
          <div className="header-actions">
            <button 
              className="refresh-btn" 
              onClick={refreshWallpapers}
              disabled={refreshing}
              title="刷新壁纸"
            >
              {refreshing ? '⟳' : '↻'}
            </button>
            <button className="close-btn" onClick={handleClose}>
              <span className="close-icon">×</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⟳</div>
            <div className="loading-text">正在加载壁纸...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{error}</div>
            <button className="retry-btn" onClick={loadWallpapers}>
              重试
            </button>
          </div>
        ) : (
          <div className="wallpaper-list">
            {wallpapers.map((wallpaper) => (
              <div
                key={wallpaper.id}
                className={`wallpaper-item ${selectedWallpaper === wallpaper.id ? 'selected' : ''}`}
                onClick={() => handleWallpaperSelect(wallpaper.id)}
              >
                <div className="wallpaper-preview">
                  {wallpaper.id === 'default' ? (
                    <div className="default-preview">默认</div>
                  ) : (
                    <img 
                      src={wallpaper.path} 
                      alt={wallpaper.name} 
                      className="wallpaper-image"
                      onError={(e) => {
                        // 图片加载失败时的处理
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                        const previewDiv = img.parentElement
                        if (previewDiv) {
                          previewDiv.innerHTML += '<div className="image-error">加载失败</div>'
                        }
                      }}
                    />
                  )}
                </div>
                <div className="wallpaper-name">{wallpaper.name}</div>
                {selectedWallpaper === wallpaper.id && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WallpaperSelector
