import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import { UsePathManagerOptions, UsePathManagerReturn } from '../types';

export function usePathManager({ isPluginMode, basename }: UsePathManagerOptions): UsePathManagerReturn {
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // 从URL解析路径
  const parsePathFromUrl = useCallback(() => {
    if (isPluginMode) {
      return [];
    }

    let pathString = window.location.pathname;
    if (pathString.startsWith(basename)) {
      pathString = pathString.slice(basename.length + 1);
    } else {
      pathString = pathString.slice(1);
    }

    if (pathString) {
      try {
        const path = JSON.parse(decodeURIComponent(pathString));
        return Array.isArray(path) ? path : [];
      } catch {
        logger.error('Failed to parse path from URL');
        return [];
      }
    }

    return [];
  }, [isPluginMode, basename]);

  // 更新URL以反映当前路径
  const updateUrlPath = useCallback((path: string[]) => {
    if (isPluginMode) {
      return;
    }

    const pathString = path.length > 0 ? `/${path.join('/')}` : '';
    window.history.replaceState({}, '', `${basename}${pathString}`);
  }, [isPluginMode, basename]);

  // 初始化路径
  useEffect(() => {
    const initialPath = parsePathFromUrl();
    setCurrentPath(initialPath);
  }, [parsePathFromUrl]);

  // 当路径变化时更新URL
  useEffect(() => {
    updateUrlPath(currentPath);
  }, [currentPath, updateUrlPath]);

  // 处理浏览器的前进/后退按钮
  useEffect(() => {
    const handlePopState = () => {
      const path = parsePathFromUrl();
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parsePathFromUrl]);

  // 更新路径的方法
  const updatePath = useCallback((path: string[]) => {
    setCurrentPath(path);
  }, []);

  // 导航到子文件夹
  const navigateToChild = useCallback((folderName: string) => {
    setCurrentPath(prev => [...prev, folderName]);
  }, []);

  // 返回上一级
  const navigateBack = useCallback(() => {
    setCurrentPath(prev => prev.slice(0, -1));
  }, []);

  // 返回首页
  const navigateHome = useCallback(() => {
    setCurrentPath([]);
  }, []);

  return {
    currentPath,
    updatePath,
    navigateToChild,
    navigateBack,
    navigateHome
  };
}

export default usePathManager;