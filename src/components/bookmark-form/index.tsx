import { useState, useEffect, ReactElement, FormEvent, ChangeEvent } from 'react'
import { BookmarkFormProps } from '../../types'
import { getFaviconBase64 } from '../../utils/get-favicon'
import { getPageTitle } from '../../utils/get-page-title'
import './index.scss'

function BookmarkForm({ bookmark, onSave, onCancel }: BookmarkFormProps): ReactElement {
  const [title, setTitle] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [icon, setIcon] = useState<string>('📎')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect((): void => {
    if (bookmark) {
      setTitle(bookmark.title)
      setUrl(bookmark.url)
      setIcon(bookmark.icon)
    } else {
      setTitle('')
      setUrl('')
      setIcon('📎')
    }
  }, [bookmark])

  // 使用debounce优化URL输入时的favicon和标题获取
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (url) {
        try {
          new URL(url)
          setIsLoading(true)
          
          // 并行获取favicon和页面标题
          const [favicon, pageTitle] = await Promise.all([
            getFaviconBase64(url),
            getPageTitle(url)
          ])
          
          // 设置favicon
          console.log('获取到的favicon结果:', favicon)
          if (favicon) {
            console.log('设置favicon:', favicon.substring(0, 100) + '...')
            setIcon(favicon)
          } else {
            console.log('未获取到favicon，使用默认图标')
            setIcon('📎')
          }
          
          // 设置页面标题（只有当用户还没有输入自定义标题时）
          if (pageTitle && !title) {
            console.log('自动设置页面标题:', pageTitle)
            setTitle(pageTitle)
          }
        } catch (error) {
          console.error('URL格式错误或获取信息失败:', error)
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
          <div className="form-group icon-preview">
            <label>图标预览</label>
            <div className="icon-preview-container">
              {isLoading ? (
                <div className="loading-spinner">加载中...</div>
              ) : icon.startsWith('data:image/') ? (
                <img src={icon} alt="Favicon预览" className="preview-img" />
              ) : (
                <div className="default-icon">{icon}</div>
              )}
            </div>
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
