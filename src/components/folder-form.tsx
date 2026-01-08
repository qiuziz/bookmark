import { useState, useEffect, ReactElement, FormEvent, ChangeEvent } from 'react'
import { Folder, FolderFormProps } from '../types'
import FolderSelector from './folder-selector'
import './folder-form.scss'

function FolderForm({ folders, currentPath, currentFolderId, mode = 'create', editFolder, onSave, onCancel }: FolderFormProps): ReactElement {
  const [title, setTitle] = useState<string>('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(currentFolderId)

  useEffect((): void => {
    if (mode === 'rename' && editFolder) {
      setTitle(editFolder.title)
      setSelectedParentId(editFolder.parentId)
    } else if (mode === 'create') {
      setTitle('')
      setSelectedParentId(currentFolderId)
    }
  }, [mode, editFolder, currentFolderId])

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!title.trim()) return

    if (mode === 'rename' && editFolder) {
      onSave({
        title: title.trim(),
        parentId: editFolder.parentId,
        path: editFolder.path
      })
    } else {
      const parentFolder = folders.find((f: Folder): boolean => f.id === selectedParentId)
      onSave({
        title: title.trim(),
        parentId: selectedParentId,
        path: [...(parentFolder?.path ?? []), title.trim()]
      })
    }
  }

  return (
    <div className="folder-form-overlay">
      <div className="folder-form">
        <h2>{mode === 'rename' ? '重命名文件夹' : '新建文件夹'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">文件夹名称</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
              placeholder="请输入文件夹名称"
              autoFocus
            />
          </div>
          {mode === 'create' && (
            <div className="form-group">
              <label>位置</label>
              <FolderSelector
                folders={folders}
                currentPath={currentPath}
                value={selectedParentId}
                onChange={setSelectedParentId}
              />
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn-save">
              {mode === 'rename' ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FolderForm
