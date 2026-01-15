import { useState, useRef, ReactElement, ChangeEvent, DragEvent } from 'react'
import { ImportModalProps } from '../../types'
import './index.scss'

function ImportModal({ onImport, onCancel }: ImportModalProps): ReactElement {
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File): void => {
    const isHtml = file.type === 'text/html' || file.name.endsWith('.html')
    const isJson = file.type === 'application/json' || file.name.endsWith('.json')
    
    if (!isHtml && !isJson) {
      alert('请选择HTML或JSON格式的书签文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>): void => {
      const content = e.target?.result as string
      onImport(content, file.name)
    }
    reader.readAsText(file)
  }

  const onButtonClick = (): void => {
    fileInputRef.current?.click()
  }

  return (
    <div className="import-modal-overlay">
      <div className="import-modal">
        <h2>导入书签</h2>
        <div className="import-content">
          <p>从HTML文件导入书签</p>
          <div
            className={`file-drop-area ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.json"
              onChange={handleFileChange}
              className="file-input"
              multiple={false}
            />
            <div className="file-drop-content">
              <div className="file-drop-icon">📁</div>
              <p>拖拽HTML或JSON文件到此处，或点击选择文件</p>
              <p className="file-drop-hint">支持从Edge/Chrome浏览器导出的HTML书签文件或本工具导出的JSON文件</p>
            </div>
          </div>
          <div className="import-actions">
            <button className="btn-cancel" onClick={onCancel}>取消</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
