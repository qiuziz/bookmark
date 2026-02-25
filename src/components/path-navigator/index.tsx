import React, { useCallback } from 'react';
import { Folder } from '../../types';
import './index.scss';

interface PathNavigatorProps {
  currentPath: string[];
  onBack: () => void;
  onHome: () => void;
  onFolderClick: (folder: Folder) => void;
}

export function PathNavigator({ currentPath, onBack, onHome }: PathNavigatorProps) {
  const handlePathClick = useCallback((_index: number) => {
    // 这里可以实现点击路径跳转到对应层级的逻辑
    // 暂时留空，因为路径管理逻辑在父组件中
  }, []);

  return (
    <div className="path-navigator">
      <button 
        className="path-item home-button" 
        onClick={onHome}
        title="返回首页"
      >
        🏠
      </button>
      {currentPath.map((folderName, index) => (
        <React.Fragment key={index}>
          <span className="path-separator">/</span>
          <button 
            className="path-item"
            onClick={() => handlePathClick(index)}
            title={folderName}
          >
            {folderName}
          </button>
        </React.Fragment>
      ))}
      {currentPath.length > 0 && (
        <button 
          className="path-item back-button" 
          onClick={onBack}
          title="返回上一级"
        >
          ←
        </button>
      )}
    </div>
  );
}

export default PathNavigator;