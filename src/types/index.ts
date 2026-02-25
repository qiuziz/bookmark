// 书签类型
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  parentId: string | null;
  path: string[];
  isPinned: boolean;
  createdAt?: number;
}

// 文件夹类型
export interface Folder {
  id: string;
  title: string;
  parentId: string | null;
  path: string[];
}

// 消息类型
export interface MessageAction {
  text: string;
  onClick: () => void;
}

export interface Message {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
  actions?: MessageAction[];
}

// 书签表单数据类型
export interface BookmarkFormData {
  title: string;
  url: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  path?: string[];
  isPinned?: boolean;
}

// 导入的书签数据
export interface ImportedData {
  folders: Folder[];
  bookmarks: Bookmark[];
}

// 壁纸类型
export interface Wallpaper {
  id: string;
  name: string;
  path: string;
  thumbnail?: string;
}

// Header 组件属性
export interface HeaderProps {
  onAdd: () => void;
  onAddFolder: () => void;
  onImport: () => void;
  onExport: () => void;
  onWallpaperClick?: () => void;
  onBack?: () => void;
  onHome?: () => void;
  currentPath: string[];
  onAuthorizeFileStorage?: () => void;
  onManualBackup?: () => void;
  onFileImport?: () => void;
  isFileStorageSupported?: boolean;
  isFileStorageAuthorized?: boolean;
  isFileStorageConfigured?: boolean;
  onRestoreFileStorage?: () => void;
}

// FolderCard 组件属性
export interface FolderCardProps {
  folder: Folder;
  onClick: (folder: Folder) => void;
  onRename?: (folder: Folder) => void;
  onDelete?: (folderId: string) => void;
  isMobile: boolean;
  showActions?: boolean;
  onActionsToggle?: () => void;
}

// BookmarkCard 组件属性
export interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onPin: (bookmark: Bookmark) => void;
  isMobile: boolean;
  showActions?: boolean;
  onActionsToggle?: () => void;
}

// BookmarkForm 组件属性
export interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  onSave: (formData: BookmarkFormData) => void;
  onCancel: () => void;
}

// 文件夹表单数据类型
export interface FolderFormData {
  title: string;
  parentId?: string | null;
  path?: string[];
}

// FolderForm 组件属性
export interface FolderFormProps {
  folders: Folder[];
  currentPath: string[];
  currentFolderId: string | null;
  mode?: 'create' | 'rename';
  editFolder?: Folder | null;
  onSave: (formData: FolderFormData) => void;
  onCancel: () => void;
}

// ImportModal 组件属性
export interface ImportModalProps {
  onImport: (htmlContent: string, fileName: string) => void;
  onCancel: () => void;
}

// MessageProvider 子组件类型
export interface MessageProviderProps {
  children: React.ReactNode;
}

// useBookmarks hook 返回类型
export interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  folders: Folder[];
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => Bookmark;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  reorderBookmarks: (newOrder: Bookmark[]) => void;
  togglePinBookmark: (id: string) => void;
  addFolder: (folder: Omit<Folder, 'id'>) => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  importBookmarks: (importedBookmarks: Bookmark[], importedFolders?: Folder[]) => void;
  isFileStorageSupported: boolean;
  isFileStorageAuthorized: boolean;
  requestFileStorageAuthorization: () => Promise<boolean>;
  backupData: () => Promise<boolean>;
  importFromFile: () => Promise<void>;
}

// useResponsive hook 返回类型
export interface UseResponsiveReturn {
  columns: number;
  isMobile: boolean;
}

// usePathManager hook 选项类型
export interface UsePathManagerOptions {
  isPluginMode: boolean;
  basename: string;
}

// usePathManager hook 返回类型
export interface UsePathManagerReturn {
  currentPath: string[];
  updatePath: (path: string[]) => void;
  navigateToChild: (folderName: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;
}

// 列表项类型（用于渲染）
export interface ListItem {
  type: 'bookmark' | 'folder';
  data: Bookmark | Folder;
  isPinned?: boolean;
}

// 存储数据类型
export interface StorageData {
  bookmarks: Bookmark[];
  folders: Folder[];
}

// 错误类型定义
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 错误代码定义
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
