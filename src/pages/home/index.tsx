import { useState, useCallback, useMemo, useEffect, ReactElement } from 'react';
import Header from '../../components/header';
import BookmarkCard from '../../components/bookmark-card';
import FolderCard from '../../components/folder-card';
import BookmarkForm from '../../components/bookmark-form';
import ImportModal from '../../components/import-modal';
import { useBookmarks } from '../../hooks/use-bookmarks';
import { useResponsive } from '../../hooks/use-responsive';
import { useMessage } from '../../components/message-provider';
import { parseEdgeBookmarks, exportBookmarks } from '../../utils/edge-bookmarks';
import { Bookmark, Folder, BookmarkFormData } from '../../types';
import './index.scss';

function Home(): ReactElement {
  const {
    bookmarks,
    folders,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePinBookmark,
    importBookmarks
  } = useBookmarks();
  const { isMobile, columns } = useResponsive();
  const { showMessage } = useMessage();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

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

    console.log('=== currentFolders 调试 ===');
    console.log('当前路径:', currentPath);
    console.log('当前文件夹ID:', currentFolderId);
    console.log('总文件夹数:', folders.length);
    console.log('过滤后数量:', result.length);
    if (result.length > 0) {
      console.log('过滤后的文件夹:');
      result.slice(0, 5).forEach((f: Folder) => {
        console.log(`  id: ${f.id}, title: ${f.title}, parentId: ${f.parentId}, path: ${f.path}`);
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

    console.log('=== currentBookmarks 调试 ===');
    console.log('当前路径:', currentPath);
    console.log('当前文件夹ID:', currentFolderId);
    console.log('总书签数:', bookmarks.length);
    console.log('过滤后数量:', result.length);

    return result;
  }, [currentPath, bookmarks, currentFolderId]);

  const pinnedBookmarks: Bookmark[] = useMemo((): Bookmark[] => {
    return currentBookmarks.filter((b: Bookmark): boolean => b.isPinned);
  }, [currentBookmarks]);

  const regularBookmarks: Bookmark[] = useMemo((): Bookmark[] => {
    return currentBookmarks.filter((b: Bookmark): boolean => !b.isPinned);
  }, [currentBookmarks]);

  const displayItems: (Folder | Bookmark)[] = useMemo((): (Folder | Bookmark)[] => {
    const items = [...currentFolders, ...regularBookmarks];

    console.log('=== 显示调试信息 ===');
    console.log('当前路径:', currentPath);
    console.log('当前文件夹ID:', currentFolderId);
    console.log('当前文件夹数量:', currentFolders.length);
    console.log('当前书签数量:', regularBookmarks.length);
    console.log('显示项目数量:', items.length);

    if (items.length > 0 && items.length <= 10) {
      items.forEach((item: Folder | Bookmark, i: number) => {
        if ('url' in item) {
          console.log(`  [${i}] 书签: ${item.title} (parentId: ${item.parentId})`);
        } else {
          console.log(
            `  [${i}] 文件夹: ${item.title} (id: ${item.id}, parentId: ${item.parentId})`
          );
        }
      });
    }

    return items;
  }, [currentFolders, regularBookmarks]);

  const hasContent: boolean = displayItems.length > 0 || pinnedBookmarks.length > 0;

  const handleAdd = useCallback((): void => {
    setEditingBookmark(null);
    setShowForm(true);
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
    },
    [editingBookmark, updateBookmark, addBookmark, currentFolderId, currentPath]
  );

  const handleCancel = useCallback((): void => {
    setShowForm(false);
    setEditingBookmark(null);
  }, []);

  const handleOpenImport = useCallback((): void => {
    setShowImportModal(true);
  }, []);

  const handleImport = useCallback(
    (htmlContent: string, _fileName: string): void => {
      try {
        const { folders: importedFolders, bookmarks: importedBookmarks } =
          parseEdgeBookmarks(htmlContent);

        console.log('=== 导入调试信息 ===');
        console.log('导入的书签数量:', importedBookmarks.length);
        console.log('导入的文件夹数量:', importedFolders.length);
        console.log('当前路径:', currentPath);
        console.log('当前文件夹ID:', currentFolderId);

        if (importedFolders.length > 0) {
          console.log('文件夹详情:');
          importedFolders.forEach((f: Folder, i: number) => {
            console.log(
              `  [${i}] ${f.title} (ID: ${f.id}, parentId: ${f.parentId}, path: ${f.path.join(
                '/'
              )})`
            );
          });
        }

        if (importedBookmarks.length > 0) {
          console.log('书签详情 (前5个):');
          importedBookmarks.slice(0, 5).forEach((b: Bookmark, i: number) => {
            console.log(
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

        console.log('过滤后的新书签数量:', newBookmarks.length);
        console.log('过滤后的新文件夹数量:', newFolders.length);

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
        console.error('Import error:', err);
      }
    },
    [bookmarks, folders, currentPath, currentFolderId, importBookmarks, showMessage]
  );

  const handleCloseImport = useCallback((): void => {
    setShowImportModal(false);
  }, []);

  const handleExport = useCallback((): void => {
    const htmlContent = exportBookmarks(folders, bookmarks);
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
  }, [folders, bookmarks, showMessage]);

  const handleFolderClick = useCallback((folder: Folder): void => {
    setCurrentPath((prev: string[]): string[] => [...prev, folder.title]);
  }, []);

  const handleBack = useCallback((): void => {
    setCurrentPath((prev: string[]): string[] => prev.slice(0, -1));
  }, []);

  const handleHome = useCallback((): void => {
    setCurrentPath([]);
  }, []);

  useEffect((): (() => void) | void => {
    const pathString = window.location.pathname.slice(1);
    if (pathString) {
      try {
        const path = JSON.parse(decodeURIComponent(pathString));
        setCurrentPath(path);
      } catch {
        console.error('Failed to parse path from URL');
      }
    }
  }, []);

  useEffect((): (() => void) | void => {
    const handlePopState = (): void => {
      const pathString = window.location.pathname.slice(1);
      if (pathString) {
        try {
          const path = JSON.parse(decodeURIComponent(pathString));
          setCurrentPath(path);
        } catch {
          console.error('Failed to parse path from URL');
        }
      } else {
        setCurrentPath([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return (): void => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect((): void => {
    const pathString = window.location.pathname.slice(1);
    const expectedPath =
      currentPath.length > 0 ? encodeURIComponent(JSON.stringify(currentPath)) : '';

    if (pathString !== expectedPath) {
      const newPath = currentPath.length > 0 ? '/' + expectedPath : '/';
      window.history.pushState(null, '', newPath);
    }
  }, [currentPath]);

  const handlePin = useCallback(
    (bookmark: Bookmark): void => {
      togglePinBookmark(bookmark.id);
    },
    [togglePinBookmark]
  );

  const handleCardActionsToggle = useCallback((bookmarkId: string): void => {
    setActiveCardId((prev: string | null): string | null =>
      prev === bookmarkId ? null : bookmarkId
    );
  }, []);

  return (
    <div className="app">
      <Header
        onAdd={handleAdd}
        onImport={handleOpenImport}
        onExport={handleExport}
        onBack={currentPath.length > 0 ? handleBack : undefined}
        onHome={currentPath.length > 0 ? handleHome : undefined}
        currentPath={currentPath}
      />

      <main className="main-content">
        {hasContent ? (
          <>
            {pinnedBookmarks.length > 0 && (
              <>
                <div
                  className="cards-grid"
                  style={
                    {
                      '--columns': columns
                    } as React.CSSProperties
                  }
                >
                  {pinnedBookmarks.map((bookmark: Bookmark, index: number) => (
                    <BookmarkCard
                      key={`pinned-${bookmark.id}-${index}`}
                      bookmark={bookmark}
                      onEdit={handleEdit}
                      onDelete={deleteBookmark}
                      onPin={handlePin}
                      isMobile={isMobile}
                      showActions={activeCardId === bookmark.id}
                      onActionsToggle={
                        isMobile ? () => handleCardActionsToggle(bookmark.id) : undefined
                      }
                    />
                  ))}
                </div>
                <div className="divider"></div>
              </>
            )}
            <div
              className="cards-grid"
              style={
                {
                  '--columns': columns
                } as React.CSSProperties
              }
            >
              {displayItems.map((item: Folder | Bookmark, index: number) => {
                if ('url' in item) {
                  return (
                    <BookmarkCard
                      key={`bookmark-${item.id}-${index}`}
                      bookmark={item}
                      onEdit={handleEdit}
                      onDelete={deleteBookmark}
                      onPin={handlePin}
                      isMobile={isMobile}
                      showActions={activeCardId === item.id}
                      onActionsToggle={
                        isMobile ? () => handleCardActionsToggle(item.id) : undefined
                      }
                    />
                  );
                }
                return (
                  <FolderCard
                    key={`folder-${item.id}-${index}`}
                    folder={item}
                    onClick={handleFolderClick}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>开始管理您的书签</h2>
            <p>点击右上角的"添加"按钮来添加第一个书签</p>
          </div>
        )}
      </main>

      {showForm && (
        <BookmarkForm bookmark={editingBookmark} onSave={handleSave} onCancel={handleCancel} />
      )}

      {showImportModal && <ImportModal onImport={handleImport} onCancel={handleCloseImport} />}
    </div>
  );
}

export default Home;
