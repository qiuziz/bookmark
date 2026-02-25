import React, { ReactElement } from 'react'
import { HeaderProps } from '../../types'
import { IS_PLUGIN } from '../../utils/env'
import logger from '../../utils/logger'
import './index.scss'

function Header({ onAdd, onAddFolder, onImport, onExport, onWallpaperClick, onBack, onHome, currentPath, onAuthorizeFileStorage, onRestoreFileStorage, onManualBackup, onFileImport, isFileStorageSupported, isFileStorageAuthorized, isFileStorageConfigured }: HeaderProps): ReactElement {
  // 调试开关状态，仅在插件模式下使用
  const [debugMode, setDebugMode] = React.useState(() => IS_PLUGIN ? logger.getDebug() : false);

  // 切换调试模式
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    logger.setDebug(newMode);
  };

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
        <button className="header-btn wallpaper" onClick={onWallpaperClick} title="设置壁纸">
          <span className="btn-icon">🎨</span>
          <span className="btn-text">壁纸</span>
        </button>
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

        {/* 文件存储相关按钮 */}
        {isFileStorageSupported && (
          <>
            {!isFileStorageAuthorized ? (
              isFileStorageConfigured ? (
                <button className="header-btn restore-storage" onClick={onRestoreFileStorage} title="恢复存储授权">
                  <span className="btn-icon">🔌</span>
                  <span className="btn-text">恢复同步</span>
                </button>
              ) : (
                <button className="header-btn authorize-storage" onClick={onAuthorizeFileStorage} title="授权文件存储">
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">授权存储</span>
                </button>
              )
            ) : (
              <>
                <button className="header-btn backup" onClick={onManualBackup} title="手动备份">
                  <span className="btn-icon">🔄</span>
                  <span className="btn-text">备份</span>
                </button>
                <button className="header-btn file-import" onClick={onFileImport} title="从文件导入">
                  <span className="btn-icon">📂</span>
                  <span className="btn-text">文件导入</span>
                </button>
              </>
            )}
          </>
        )}

        <button className="header-btn add" onClick={onAdd} title="添加书签">
          <span className="btn-icon">+</span>
          <span className="btn-text">添加</span>
        </button>
        {/* 仅在插件模式下显示调试开关 */}
        {IS_PLUGIN && (
          <div className="debug-toggle">
            <input
              type="checkbox"
              id="debug-toggle"
              checked={debugMode}
              onChange={toggleDebugMode}
            />
            <label htmlFor="debug-toggle">调试</label>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
