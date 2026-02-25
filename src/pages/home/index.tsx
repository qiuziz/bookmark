import { useState, useCallback, useMemo, ReactElement } from 'react';

// 根据环境变量判断是否为插件模式
const isPluginMode = import.meta.env.VITE_PLUGIN === 'true';
// 浏览器插件环境下不使用完整路由
const BASENAME = isPluginMode ? '' : '/bookmark';
import logger from '../../utils/logger';
import Header from '../../components/header';
import BookmarkForm from '../../components/bookmark-form';
import FolderForm from '../../components/folder-form';
import ImportModal from '../../components/import-modal';
import WallpaperSelector from '../../components/wallpaper-selector';
import BookmarkGrid from '../../components/bookmark-grid';
import PinnedBookmarks from '../../components/pinned-bookmarks';
import EmptyState from '../../components/empty-state';
import { useBookmarks } from '../../hooks/use-bookmarks';
import { useResponsive } from '../../hooks/use-responsive';
import { usePathManager } from '../../hooks/use-path-manager';
import { useMessage } from '../../components/message';
import { parseEdgeBookmarks, exportBookmarks } from '../../utils/edge-bookmarks';
import { Bookmark, Folder, BookmarkFormData, FolderFormData } from '../../types';
import './index.scss';

function Home(): ReactElement {
  const {
    bookmarks,
    folders,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePinBookmark,
    importBookmarks,
    addFolder,
    updateFolder,
    deleteFolder,
    isFileStorageSupported,
    isFileStorageAuthorized,
    isFileStorageConfigured,
    requestFileStorageAuthorization,
    restoreFileStorageAuthorization,
    backupData,
    importFromFile
  } = useBookmarks();
  const { isMobile, columns } = useResponsive();
  const { showMessage } = useMessage();
  const { currentPath, navigateToChild, navigateBack, navigateHome } = usePathManager({
    isPluginMode,
    basename: BASENAME
  });
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderFormMode, setFolderFormMode] = useState<'create' | 'rename'>('create');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showFolderForm, setShowFolderForm] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showWallpaperSelector, setShowWallpaperSelector] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<{ id: string, type: 'pinned' | 'regular' | 'folder' } | null>(null);

  const handleExport = useCallback(async (): Promise<void> => {
    try {
      const htmlContent = await exportBookmarks(folders, bookmarks);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=UTF-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookmarks_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage(`成功导出 ${folders.length} 个文件夹和 ${bookmarks.length} 个书签`, 'success');
    } catch (error) {
      logger.error('导出书签失败:', error);
      showMessage('导出书签失败，请重试', 'error');
    }
  }, [folders, bookmarks, showMessage]);

  const showExportConfirm = useCallback((): void => {
    showMessage('书签已更新', 'success', [
      {
        text: '导出',
        onClick: () => handleExport()
      }
    ]);
  }, [showMessage, handleExport]);

  const currentFolderId: string | null = useMemo(() => {
    if (currentPath.length === 0) return null;
    const pathString = JSON.stringify(currentPath);
    const folder = folders.find((f: Folder): boolean => JSON.stringify(f.path) === pathString);
    return folder?.id || null;
  }, [currentPath, folders]);

  const currentFolders: Folder[] = useMemo((): Folder[] => {
    if (currentPath.length === 0) {
      return folders.filter((f: Folder): boolean => f.parentId === null);
    }
    const result = folders.filter((f: Folder): boolean => {
      return f.parentId === currentFolderId;
    });

    logger.log('=== currentFolders 调试 ===');
    logger.log('当前路径:', currentPath);
    logger.log('当前文件夹ID:', currentFolderId);
    logger.log('总文件夹数:', folders.length);
    logger.log('过滤后数量:', result.length);
    if (result.length > 0) {
      logger.log('过滤后的文件夹:');
      result.slice(0, 5).forEach((f: Folder) => {
        logger.log(`  id: ${f.id}, title: ${f.title}, parentId: ${f.parentId}, path: ${f.path}`);
      });
    }

    return result;
  }, [currentPath, folders, currentFolderId]);

  const currentBookmarks: Bookmark[] = useMemo((): Bookmark[] => {
    if (currentPath.length === 0) {
      return bookmarks.filter((b: Bookmark): boolean => b.parentId === null);
    }
    const result = bookmarks.filter((b: Bookmark): boolean => {
      if (b.parentId !== currentFolderId) return false;
      if (b.path.length !== currentPath.length) return false;
      return b.path.every((p: string, i: number): boolean => p === currentPath[i]);
    });

    logger.log('=== currentBookmarks 调试 ===');
    logger.log('当前路径:', currentPath);
    logger.log('当前文件夹ID:', currentFolderId);
    logger.log('总书签数:', bookmarks.length);
    logger.log('过滤后数量:', result.length);

    return result;
  }, [currentPath, bookmarks, currentFolderId]);

  const pinnedBookmarks: Bookmark[] = useMemo((): Bookmark[] => {
    return bookmarks.filter((b: Bookmark): boolean => b.isPinned);
  }, [bookmarks]);

  const regularBookmarks: Bookmark[] = useMemo((): Bookmark[] => {
    return currentBookmarks;
  }, [currentBookmarks]);

  const displayItems: (Folder | Bookmark)[] = useMemo((): (Folder | Bookmark)[] => {
    const items = [...currentFolders, ...regularBookmarks];

    logger.log('=== 显示调试信息 ===');
    logger.log('当前路径:', currentPath);
    logger.log('当前文件夹ID:', currentFolderId);
    logger.log('当前文件夹数量:', currentFolders.length);
    logger.log('当前书签数量:', regularBookmarks.length);
    logger.log('显示项目数量:', items.length);

    if (items.length > 0 && items.length <= 10) {
      items.forEach((item: Folder | Bookmark, i: number) => {
        if ('url' in item) {
          logger.log(`  [${i}] 书签: ${item.title} (parentId: ${item.parentId})`);
        } else {
          logger.log(
            `  [${i}] 文件夹: ${item.title} (id: ${item.id}, parentId: ${item.parentId})`
          );
        }
      });
    }

    return items;
  }, [currentFolders, regularBookmarks]);

  const hasContent: boolean = displayItems.length > 0 || (currentPath.length === 0 && pinnedBookmarks.length > 0);

  const handleAdd = useCallback((): void => {
    setEditingBookmark(null);
    setShowForm(true);
  }, []);

  const handleAddFolder = useCallback((): void => {
    setShowFolderForm(true);
  }, []);

  const handleEdit = useCallback((bookmark: Bookmark): void => {
    setEditingBookmark(bookmark);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(
    (formData: BookmarkFormData): void => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, formData);
      } else {
        addBookmark({
          title: formData.title,
          url: formData.url,
          icon: formData.icon || '🔖',
          color: formData.color || '#666666',
          parentId: currentFolderId,
          path: currentPath,
          isPinned: formData.isPinned ?? false
        });
      }
      setShowForm(false);
      setEditingBookmark(null);
      showExportConfirm();
    },
    [editingBookmark, updateBookmark, addBookmark, currentFolderId, currentPath, showExportConfirm]
  );

  const handleCancel = useCallback((): void => {
    setShowForm(false);
    setEditingBookmark(null);
  }, []);

  const handleCancelFolder = useCallback((): void => {
    setShowFolderForm(false);
    setEditingFolder(null);
    setFolderFormMode('create');
  }, []);

  const handleSaveFolder = useCallback(
    (formData: FolderFormData): void => {
      if (folderFormMode === 'rename' && editingFolder) {
        updateFolder(editingFolder.id, { title: formData.title });
        setShowFolderForm(false);
        setEditingFolder(null);
        setFolderFormMode('create');
        showMessage(`已重命名文件夹为「${formData.title}」`, 'success');
      } else {
        addFolder({
          title: formData.title,
          parentId: formData.parentId ?? null,
          path: formData.path || []
        });
        setShowFolderForm(false);
        showMessage(`已创建文件夹「${formData.title}」`, 'success');
      }
      showExportConfirm();
    },
    [folderFormMode, editingFolder, addFolder, updateFolder, showMessage, showExportConfirm]
  );

  const handleRenameFolder = useCallback((folder: Folder): void => {
    setEditingFolder(folder);
    setFolderFormMode('rename');
    setShowFolderForm(true);
  }, []);

  const handleDeleteFolder = useCallback((folderId: string): void => {
    const folder = folders.find((f: Folder): boolean => f.id === folderId);
    if (folder) {
      deleteFolder(folderId);
      showMessage(`已删除文件夹「${folder.title}」`, 'success');
      showExportConfirm();
    }
  }, [folders, deleteFolder, showMessage, showExportConfirm]);

  const handleOpenImport = useCallback((): void => {
    setShowImportModal(true);
  }, []);

  const handleImport = useCallback(
    (fileContent: string, fileName: string): void => {
      try {
        let importedFolders: Folder[] = [];
        let importedBookmarks: Bookmark[] = [];

        // 根据文件名判断文件类型
        if (fileName.endsWith('.json')) {
          // 处理JSON文件
          const jsonData = JSON.parse(fileContent);

          // 确保bookmarks是数组
          if (Array.isArray(jsonData.bookmarks)) {
            importedBookmarks = jsonData.bookmarks;
          }

          // 确保folders是数组
          if (Array.isArray(jsonData.folders)) {
            importedFolders = jsonData.folders;
          }
        } else {
          // 处理HTML文件
          const { folders, bookmarks } = parseEdgeBookmarks(fileContent);
          importedFolders = folders;
          importedBookmarks = bookmarks;
        }

        // 确保导入的数据是有效的
        importedBookmarks = importedBookmarks.map((bookmark: any) => ({
          ...bookmark,
          // 确保必要字段存在
          id: bookmark.id || `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: bookmark.title || '未命名书签',
          url: bookmark.url || '',
          icon: bookmark.icon || '🔖',
          color: bookmark.color || '#666666',
          parentId: bookmark.parentId || null,
          path: bookmark.path || [],
          isPinned: bookmark.isPinned || false,
          createdAt: bookmark.createdAt || Date.now()
        }));

        importedFolders = importedFolders.map((folder: any) => ({
          ...folder,
          // 确保必要字段存在
          id: folder.id || `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: folder.title || '未命名文件夹',
          parentId: folder.parentId || null,
          path: folder.path || []
        }));

        logger.log('=== 导入调试信息 ===');
        logger.log('导入的书签数量:', importedBookmarks.length);
        logger.log('导入的文件夹数量:', importedFolders.length);
        logger.log('当前路径:', currentPath);
        logger.log('当前文件夹ID:', currentFolderId);

        if (importedFolders.length > 0) {
          logger.log('文件夹详情:');
          importedFolders.forEach((f: Folder, i: number) => {
            logger.log(
              `  [${i}] ${f.title} (ID: ${f.id}, parentId: ${f.parentId}, path: ${f.path.join(
                '/'
              )})`
            );
          });
        }

        if (importedBookmarks.length > 0) {
          logger.log('书签详情 (前5个):');
          importedBookmarks.slice(0, 5).forEach((b: Bookmark, i: number) => {
            logger.log(
              `  [${i}] ${b.title} (ID: ${b.id}, parentId: ${b.parentId}, path: ${b.path.join(
                '/'
              )})`
            );
          });
        }

        if (importedBookmarks.length === 0 && importedFolders.length === 0) {
          showMessage('未在文件中找到有效的书签', 'error');
          return;
        }

        const existingUrls = new Set(bookmarks.map((b: Bookmark): string => b.url));
        const newBookmarks = importedBookmarks.filter(
          (b: Bookmark): boolean => !existingUrls.has(b.url)
        );

        const existingFolderKeys = new Set(
          folders.map((f: Folder): string => JSON.stringify({ title: f.title, path: f.path }))
        );
        const newFolders = importedFolders.filter(
          (f: Folder): boolean =>
            !existingFolderKeys.has(JSON.stringify({ title: f.title, path: f.path }))
        );

        logger.log('过滤后的新书签数量:', newBookmarks.length);
        logger.log('过滤后的新文件夹数量:', newFolders.length);

        if (newBookmarks.length === 0 && newFolders.length === 0) {
          showMessage('没有新的书签需要导入', 'info');
          return;
        }

        importBookmarks(newBookmarks, newFolders);
        setShowImportModal(false);
        showMessage(
          `成功导入 ${newFolders.length} 个文件夹和 ${newBookmarks.length} 个书签`,
          'success'
        );
      } catch (err) {
        showMessage('导入失败，请确保选择正确的书签文件', 'error');
        logger.error('Import error:', err);
      }
    },
    [bookmarks, folders, currentPath, currentFolderId, importBookmarks, showMessage]
  );

  const handleCloseImport = useCallback((): void => {
    setShowImportModal(false);
  }, []);

  const handleOpenWallpaperSelector = useCallback((): void => {
    setShowWallpaperSelector(true);
  }, []);

  const handleCloseWallpaperSelector = useCallback((): void => {
    setShowWallpaperSelector(false);
  }, []);

  // 处理文件存储授权
  const handleRequestFileStorage = useCallback(async (): Promise<void> => {
    try {
      const success = await requestFileStorageAuthorization();
      if (success) {
        showMessage('文件存储授权成功，数据将自动备份', 'success');
      } else {
        showMessage('文件存储操作取消或失败', 'error');
      }
    } catch (error) {
      logger.error('文件存储授权错误:', error);
      showMessage('文件存储授权过程中发生错误', 'error');
    }
  }, [requestFileStorageAuthorization, showMessage]);

  // 处理恢复文件存储授权
  const handleRestoreFileStorage = useCallback(async (): Promise<void> => {
    try {
      const success = await restoreFileStorageAuthorization();
      if (success) {
        showMessage('已恢复同步，数据将自动备份', 'success');
      } else {
        showMessage('恢复同步操作取消或失败', 'error');
      }
    } catch (error) {
      logger.error('恢复同步错误:', error);
      showMessage('恢复同步过程中发生错误', 'error');
    }
  }, [restoreFileStorageAuthorization, showMessage]);

  // 处理手动备份
  const handleManualBackup = useCallback(async (): Promise<void> => {
    try {
      if (!isFileStorageAuthorized) {
        showMessage('请先授权文件存储访问权限', 'info');
        return;
      }

      const success = await backupData();
      if (success) {
        showMessage('数据备份成功', 'success');
      } else {
        showMessage('数据备份失败', 'error');
      }
    } catch (error) {
      logger.error('手动备份错误:', error);
      showMessage('手动备份过程中发生错误', 'error');
    }
  }, [isFileStorageAuthorized, backupData, showMessage]);

  // 处理从文件导入
  const handleFileImport = useCallback(async (): Promise<void> => {
    try {
      await importFromFile();
      showMessage('从文件导入数据成功', 'success');
    } catch (error) {
      logger.error('文件导入错误:', error);
      showMessage('从文件导入数据失败', 'error');
    }
  }, [importFromFile, showMessage]);

  const handleFolderClick = useCallback((folder: Folder): void => {
    navigateToChild(folder.title);
  }, [navigateToChild]);

  const handleBack = useCallback((): void => {
    navigateBack();
  }, [navigateBack]);

  const handleHome = useCallback((): void => {
    navigateHome();
  }, [navigateHome]);

  const handlePin = useCallback(
    (bookmark: Bookmark): void => {
      togglePinBookmark(bookmark.id);
      showExportConfirm();
    },
    [togglePinBookmark, showExportConfirm]
  );

  const handleDeleteBookmark = useCallback(
    (bookmarkId: string): void => {
      deleteBookmark(bookmarkId);
      showExportConfirm();
    },
    [deleteBookmark, showExportConfirm]
  );

  const handleCardActionsToggle = useCallback((cardId: string, cardType: 'pinned' | 'regular' | 'folder'): void => {
    setActiveCardId((prev: { id: string, type: 'pinned' | 'regular' | 'folder' } | null): { id: string, type: 'pinned' | 'regular' | 'folder' } | null =>
      prev?.id === cardId && prev?.type === cardType ? null : { id: cardId, type: cardType }
    );
  }, []);

  return (
    <div className="app">
      <Header
        onAdd={handleAdd}
        onAddFolder={handleAddFolder}
        onImport={handleOpenImport}
        onExport={handleExport}
        onWallpaperClick={handleOpenWallpaperSelector}
        onBack={currentPath.length > 0 ? handleBack : undefined}
        onHome={currentPath.length > 0 ? handleHome : undefined}
        currentPath={currentPath}
        onAuthorizeFileStorage={handleRequestFileStorage}
        onRestoreFileStorage={handleRestoreFileStorage}
        onManualBackup={handleManualBackup}
        onFileImport={handleFileImport}
        isFileStorageSupported={isFileStorageSupported}
        isFileStorageAuthorized={isFileStorageAuthorized}
        isFileStorageConfigured={isFileStorageConfigured}
      />

      <main className="main-content">
        {hasContent ? (
          <>
            {currentPath.length === 0 && (
              <PinnedBookmarks
                bookmarks={pinnedBookmarks}
                columns={columns}
                isMobile={isMobile}
                activeCardId={activeCardId}
                onEdit={handleEdit}
                onDelete={handleDeleteBookmark}
                onPin={handlePin}
                onCardActionsToggle={handleCardActionsToggle}
              />
            )}
            <BookmarkGrid
              items={displayItems}
              columns={columns}
              isMobile={isMobile}
              activeCardId={activeCardId}
              onBookmarkEdit={handleEdit}
              onBookmarkDelete={handleDeleteBookmark}
              onBookmarkPin={handlePin}
              onFolderClick={handleFolderClick}
              onFolderRename={handleRenameFolder}
              onFolderDelete={handleDeleteFolder}
              onCardActionsToggle={handleCardActionsToggle}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {showForm && (
        <BookmarkForm bookmark={editingBookmark} onSave={handleSave} onCancel={handleCancel} />
      )}

      {showImportModal && <ImportModal onImport={handleImport} onCancel={handleCloseImport} />}

      {showFolderForm && (
        <FolderForm
          folders={folders}
          currentPath={currentPath}
          currentFolderId={currentFolderId}
          mode={folderFormMode}
          editFolder={editingFolder}
          onSave={handleSaveFolder}
          onCancel={handleCancelFolder}
        />
      )}

      {showWallpaperSelector && (
        <WallpaperSelector onClose={handleCloseWallpaperSelector} />
      )}
    </div>
  );
}

export default Home;
