import { useState, useRef } from 'react'
import './ImportModal.scss'

function ImportModal({ onImport, onCancel }) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      alert('请选择HTML格式的书签文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      onImport(content, file.name)
    }
    reader.readAsText(file)
  }

  const onButtonClick = () => {
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
              accept=".html"
              onChange={handleFileChange}
              className="file-input"
              multiple={false}
            />
            <div className="file-drop-content">
              <div className="file-drop-icon">📁</div>
              <p>拖拽HTML文件到此处，或点击选择文件</p>
              <p className="file-drop-hint">支持从Edge/Chrome浏览器导出的书签HTML文件</p>
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
