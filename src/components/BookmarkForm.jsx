import { useState, useEffect } from 'react'
import './BookmarkForm.scss'

function BookmarkForm({ bookmark, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title)
      setUrl(bookmark.url)
    } else {
      setTitle('')
      setUrl('')
    }
  }, [bookmark])

  const handleSubmit = (e) => {
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
      url: url.trim()
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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setUrl(e.target.value)}
              placeholder="请输入书签URL"
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
