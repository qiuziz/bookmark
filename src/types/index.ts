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
  parentId?: string | null;
  path?: string[];
  isPinned?: boolean;
}