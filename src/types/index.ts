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
export interface Message {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
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

// Header 组件属性
export interface HeaderProps {
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onBack?: () => void;
  onHome?: () => void;
  currentPath: string[];
}

// FolderCard 组件属性
export interface FolderCardProps {
  folder: Folder;
  onClick: (folder: Folder) => void;
  isMobile: boolean;
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
  importBookmarks: (importedBookmarks: Bookmark[], importedFolders?: Folder[]) => void;
}

// useResponsive hook 返回类型
export interface UseResponsiveReturn {
  columns: number;
  isMobile: boolean;
}

// 列表项类型（用于渲染）
export interface ListItem {
  type: 'bookmark' | 'folder';
  data: Bookmark | Folder;
  isPinned?: boolean;
}
