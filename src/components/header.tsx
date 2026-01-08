import { HeaderProps } from '../types'
import './Header.scss'

function Header({ onAdd, onAddFolder, onImport, onExport, onBack, onHome, currentPath }: HeaderProps): React.ReactElement {
  return (
    <header className="header">
      <div className="header-left">
        {onBack && (
          <button className="header-btn back" onClick={onBack}>
            <span className="btn-icon">←</span>
            <span className="btn-text">返回</span>
          </button>
        )}
        {onHome && (
          <button className="header-btn home" onClick={onHome}>
            <span className="btn-icon">🏠</span>
            <span className="btn-text">首页</span>
          </button>
        )}
        <div className="header-title">书签小工具</div>
        {currentPath.length > 0 && (
          <div className="current-path">
            {currentPath.map((path: string, index: number) => (
              <span key={index} className="path-segment">
                {path}
                {index < currentPath.length - 1 && <span className="path-separator"> › </span>}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="header-right">
        <button className="header-btn add-folder" onClick={onAddFolder} title="新建文件夹">
          <span className="btn-icon">📁+</span>
          <span className="btn-text">新建文件夹</span>
        </button>
        <button className="header-btn export" onClick={onExport} title="导出书签">
          <span className="btn-icon">📤</span>
          <span className="btn-text">导出</span>
        </button>
        <button className="header-btn import" onClick={onImport} title="导入书签">
          <span className="btn-icon">📥</span>
          <span className="btn-text">导入</span>
        </button>
        <button className="header-btn add" onClick={onAdd} title="添加书签">
          <span className="btn-icon">+</span>
          <span className="btn-text">添加</span>
        </button>
      </div>
    </header>
  )
}

export default Header
