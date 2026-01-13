import { useState, useEffect, ReactElement, FormEvent, ChangeEvent } from 'react'
import { BookmarkFormProps } from '../../types'
import { getFaviconBase64 } from '../../utils/get-favicon'
import { getPageTitle } from '../../utils/get-page-title'
import { IS_PLUGIN } from '../../utils/env'
import logger from '../../utils/logger'
import './index.scss'

function BookmarkForm({ bookmark, onSave, onCancel }: BookmarkFormProps): ReactElement {
  const [title, setTitle] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [icon, setIcon] = useState<string>('📎')
  const [customIconUrl, setCustomIconUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 默认图标列表
  const defaultIcons = [
    '📎', '🔗', '🌐', '📚', '📖', '📝', '📄', '📃',
    '📋', '📊', '📈', '📉', '📌', '📍', '📍', '🏷️',
    '📇', '🔖', '📁', '📂', '📅', '📆', '🕒', '⏰',
    '📢', '📣', '🔔', '🔕', '💡', '🔦', '🌟', '⭐'
  ]

  useEffect((): void => {
    if (bookmark) {
      setTitle(bookmark.title)
      setUrl(bookmark.url)
      setIcon(bookmark.icon)
      // 如果图标是URL，设置到customIconUrl中
      if (bookmark.icon.startsWith('http')) {
        setCustomIconUrl(bookmark.icon)
      } else {
        setCustomIconUrl('')
      }
    } else {
      setTitle('')
      setUrl('')
      setIcon('📎')
      setCustomIconUrl('')
    }
  }, [bookmark])

  // 使用debounce优化URL输入时的favicon和标题获取
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (url && IS_PLUGIN) {
        try {
          new URL(url)
          setIsLoading(true)
          
          // 并行获取favicon和页面标题
          const [favicon, pageTitle] = await Promise.all([
            getFaviconBase64(url),
            getPageTitle(url)
          ])
          
          // 设置favicon
          logger.log('获取到的favicon结果:', favicon)
          if (favicon) {
            logger.log('设置favicon:', favicon.substring(0, 100) + '...')
            setIcon(favicon)
          } else {
            logger.log('未获取到favicon，使用默认图标')
            setIcon('📎')
          }
          
          // 设置页面标题（只有当用户还没有输入自定义标题时）
          if (pageTitle && !title) {
            logger.log('自动设置页面标题:', pageTitle)
            setTitle(pageTitle)
          }
        } catch (error) {
          logger.error('URL格式错误或获取信息失败:', error)
          setIcon('📎')
        } finally {
          setIsLoading(false)
        }
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [url, title])

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    try {
      new URL(url)
    } catch {
      alert('请输入有效的URL')
      return
    }

    onSave({
      title: title.trim(),
      url: url.trim(),
      icon: icon
    })
  }

  return (
    <div className="bookmark-form-overlay">
      <div className="bookmark-form">
        <h2>{bookmark ? '编辑书签' : '添加书签'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
              placeholder="请输入书签标题"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="url">URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => setUrl(e.target.value)}
              placeholder="请输入书签URL"
            />
          </div>
          <div className="form-group icon-selection">
            <label>选择图标</label>
            <div className="icon-selection-container">
              {/* 当前选择的图标（可能是favicon、默认图标或自定义URL图标） */}
              {(icon.startsWith('data:image/') || icon.startsWith('http')) ? (
                <button
                  type="button"
                  className="selected-icon-btn"
                  title="当前选择的图标"
                >
                  {isLoading && <div className="loading-overlay">加载中...</div>}
                  <img src={icon} alt="当前图标" className="preview-img" />
                </button>
              ) : (
                <button
                  type="button"
                  className="selected-icon-btn"
                  title="当前选择的图标"
                >
                  {isLoading && <div className="loading-overlay">加载中...</div>}
                  <div className="default-icon">{icon}</div>
                </button>
              )}
              
              {/* 所有默认图标 */}
              {defaultIcons.map((defaultIcon) => (
                <button
                  key={defaultIcon}
                  type="button"
                  className={`icon-option-btn ${icon === defaultIcon ? 'active' : ''}`}
                  onClick={() => {
                    setIcon(defaultIcon)
                    setCustomIconUrl('') // 清除自定义URL
                  }}
                  title={defaultIcon}
                >
                  {defaultIcon}
                </button>
              ))}
            </div>
          </div>
          
          {/* 自定义图标URL输入 */}
          <div className="form-group custom-icon-url">
            <label htmlFor="custom-icon-url">自定义图标URL</label>
            <input
              type="text"
              id="custom-icon-url"
              value={customIconUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const url = e.target.value
                setCustomIconUrl(url)
                
                // 当用户输入URL时，尝试预览该图标
                if (url) {
                  // 更宽松的URL验证，只要包含协议和域名就可以
                  if (/^(http|https):\/\/.+/.test(url)) {
                    setIcon(url)
                  } else {
                    // 如果URL格式不正确，保持当前图标
                    logger.log('自定义图标URL格式可能不正确，将在保存时验证')
                  }
                }
              }}
              placeholder="请输入图标URL（如：https://example.com/favicon.ico）"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookmarkForm
