import { Bookmark, Folder } from '../types';

// 添加File System Access API的类型定义
declare global {
  interface Window {
    showOpenFilePicker: (options?: any) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker: (options?: any) => Promise<FileSystemFileHandle>;
    chrome?: {
      storage: {
        local: {
          get: (keys: string | string[] | null, callback: (data: any) => void) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
    };
  }
  
  interface FileSystemFileHandle {
    queryPermission: (options?: { mode: 'read' | 'readwrite' }) => Promise<string>;
    requestPermission: (options?: { mode: 'read' | 'readwrite' }) => Promise<string>;
    getFile: () => Promise<File>;
  }
  
  // 我们不需要重新定义createWritable和write，因为TypeScript标准库已经有了这些定义
}

export interface StorageData {
  bookmarks: Bookmark[];
  folders: Folder[];
}

export class FileStorage {
  private static instance: FileStorage;
  private fileHandle: FileSystemFileHandle | null = null;
  private readonly AUTH_STATE_KEY = 'bookmark-tool-file-auth-state';
  private readonly IDB_NAME = 'bookmark-tool-db';
  private readonly IDB_STORE = 'file-handles';
  private readonly IDB_KEY = 'bookmarks-file';

  private constructor() {}

  public static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  // 检查浏览器是否支持File System Access API
  public isSupported(): boolean {
    return !!(window as any).showOpenFilePicker && !!(window as any).showSaveFilePicker;
  }

  // 检查是否已授权文件访问
  public async isAuthorized(): Promise<boolean> {
    try {
      // 使用chrome.storage API检查授权状态
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        const result = await new Promise<{ [key: string]: any }>((resolve) => {
          window.chrome!.storage.local.get(this.AUTH_STATE_KEY, (data: any) => {
            resolve(data as { [key: string]: any });
          });
        });
        // 检查授权状态是否为true
        const isAuthorized = result && result[this.AUTH_STATE_KEY] === true;
        if (!isAuthorized) {
          console.log('chrome.storage中授权状态为false或不存在，继续检查IndexedDB');
        } else {
          console.log('chrome.storage中授权状态为true，继续检查IndexedDB');
        }
      } else {
        // 非插件模式，使用localStorage
        const stored = localStorage.getItem(this.AUTH_STATE_KEY);
        if (stored !== 'true') {
          console.log('localStorage中授权状态不存在或为false，继续检查IndexedDB');
        } else {
          console.log('localStorage中授权状态为true，继续检查IndexedDB');
        }
      }
      
      // 检查IndexedDB中是否有文件句柄
      const handle = await this.loadFileHandleFromIDB();
      // 严格检查文件句柄是否有效
      if (!handle) {
        console.log('IndexedDB中没有文件句柄，需要重新授权');
        return false;
      }
      
      // 检查是否为FileSystemFileHandle对象
      if (typeof handle.kind !== 'string') {
        console.log('IndexedDB中的对象不是FileSystemFileHandle:', handle);
        return false;
      }
      
      // 验证文件句柄权限
      try {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        console.log('文件句柄权限状态:', permission);
        if (permission !== 'granted') {
          console.log('文件句柄权限不足或需要重新授权:', permission);
          
          // 如果权限是prompt，尝试请求权限
          if (permission === 'prompt') {
            try {
              const requestPermission = await handle.requestPermission({ mode: 'readwrite' });
              console.log('已请求文件句柄权限:', requestPermission);
              if (requestPermission === 'granted') {
                console.log('文件句柄权限请求成功');
              } else {
                console.log('文件句柄权限请求失败:', requestPermission);
                return false;
              }
            } catch (error) {
              console.error('请求文件句柄权限失败:', error);
              return false;
            }
          }
          
          return false;
        }
      } catch (error) {
        console.error('验证文件句柄权限失败:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('检查授权状态失败:', error);
      return false;
    }
  }

  // 初始化IndexedDB
  private async initIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.IDB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.IDB_STORE)) {
          // 创建object store，不使用autoIncrement，使用字符串key
          const store = db.createObjectStore(this.IDB_STORE);
          console.log('已创建IndexedDB object store:', this.IDB_STORE);
        }
      };
    });
  }

  // 从IndexedDB加载文件句柄
  private async loadFileHandleFromIDB(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.initIDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.IDB_STORE], 'readonly');
        const store = transaction.objectStore(this.IDB_STORE);
        const request = store.get(this.IDB_KEY);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const handle = request.result as FileSystemFileHandle | undefined;
          console.log('从IndexedDB加载的文件句柄:', handle);
          console.log('文件句柄类型:', typeof handle);
          console.log('文件句柄是否为FileSystemFileHandle:', handle && typeof handle.kind === 'string');
          resolve(handle || null);
        };
      });
    } catch (error) {
      console.error('Failed to load file handle from IndexedDB:', error);
      return null;
    }
  }

  // 保存文件句柄到IndexedDB
  private async saveFileHandleToIDB(handle: FileSystemFileHandle): Promise<void> {
    try {
      console.log('开始保存文件句柄到IndexedDB...', handle);
      const db = await this.initIDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.IDB_STORE], 'readwrite');
        const store = transaction.objectStore(this.IDB_STORE);
        
        // 先删除旧的文件句柄
        const deleteRequest = store.delete(this.IDB_KEY);
        deleteRequest.onsuccess = () => {
          console.log('已删除旧的文件句柄');
          // 然后添加新的文件句柄
          const addRequest = store.add(handle, this.IDB_KEY);
          
          addRequest.onerror = () => {
            console.error('添加文件句柄失败:', addRequest.error);
            reject(addRequest.error);
          };
          
          addRequest.onsuccess = () => {
            console.log('文件句柄已保存到IndexedDB');
            resolve();
          };
        };
        
        deleteRequest.onerror = () => {
          console.error('删除文件句柄失败:', deleteRequest.error);
          // 如果删除失败，继续尝试添加
          const addRequest = store.add(handle, this.IDB_KEY);
          
          addRequest.onerror = () => {
            console.error('添加文件句柄失败:', addRequest.error);
            reject(addRequest.error);
          };
          
          addRequest.onsuccess = () => {
            console.log('文件句柄已保存到IndexedDB');
            resolve();
          };
        };
        
        transaction.oncomplete = () => {
          console.log('IndexedDB事务完成');
        };
        
        transaction.onerror = () => {
          console.error('IndexedDB事务失败:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Failed to save file handle to IndexedDB:', error);
      throw error;
    }
  }

  // 请求文件访问授权
  public async requestAuthorization(): Promise<boolean> {
    try {
      // 请求用户选择文件或创建新文件
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'bookmarks.json',
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ],
        excludeAcceptAllOption: true
      });

      this.fileHandle = handle;
      
      // 先保存文件句柄到IndexedDB，成功后再保存授权状态
      try {
        await this.saveFileHandleToIDB(handle);
        this.saveAuthState();
        return true;
      } catch (error) {
        console.error('保存文件句柄失败，取消授权:', error);
        this.fileHandle = null;
        return false;
      }
    } catch (error) {
      console.error('File access authorization failed:', error);
      return false;
    }
  }

  // 保存授权状态到chrome.storage或localStorage
  private saveAuthState(): void {
    try {
      // 使用chrome.storage API保存授权状态
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        window.chrome.storage.local.set({ [this.AUTH_STATE_KEY]: true }, () => {
          console.log('授权状态已保存到chrome.storage');
        });
      } else {
        // 非插件模式，使用localStorage
        localStorage.setItem(this.AUTH_STATE_KEY, 'true');
        console.log('授权状态已保存到localStorage');
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  // 读取数据
  public async readData(): Promise<StorageData | null> {
    try {
      // 如果没有文件句柄，尝试从IndexedDB加载
      if (!this.fileHandle) {
        console.log('没有文件句柄，尝试从IndexedDB加载...');
        const loadedHandle = await this.loadFileHandleFromIDB();
        if (loadedHandle) {
          this.fileHandle = loadedHandle;
          console.log('已从IndexedDB加载文件句柄');
        } else {
          console.log('无法从IndexedDB加载文件句柄');
          return null;
        }
      }

      // 验证权限
      const permission = await this.fileHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        console.error('没有读取权限:', permission);
        return null;
      }

      // 读取文件内容
      const file = await this.fileHandle.getFile();
      const content = await file.text();
      console.log('从文件读取到的数据:', content);
      return JSON.parse(content) as StorageData;
    } catch (error) {
      console.error('Failed to read data from file:', error);
      return null;
    }
  }

  // 写入数据
  public async writeData(data: StorageData): Promise<boolean> {
    try {
      // 如果没有文件句柄，尝试从IndexedDB加载
      if (!this.fileHandle) {
        console.log('没有文件句柄，尝试从IndexedDB加载...');
        const loadedHandle = await this.loadFileHandleFromIDB();
        if (loadedHandle) {
          this.fileHandle = loadedHandle;
          console.log('已从IndexedDB加载文件句柄');
        } else {
          console.log('无法从IndexedDB加载文件句柄');
          return false;
        }
      }

      // 验证权限
      const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        console.error('没有写入权限:', permission);
        return false;
      }

      // 写入文件
      const writable = await this.fileHandle.createWritable();
      const dataStr = JSON.stringify(data, null, 2);
      console.log('写入文件的数据:', dataStr);
      await writable.write(dataStr);
      await writable.close();
      console.log('数据已成功写入文件');
      return true;
    } catch (error) {
      console.error('Failed to write data to file:', error);
      return false;
    }
  }

  // 手动备份数据
  public async backupData(data?: StorageData): Promise<boolean> {
    try {
      // 如果提供了数据参数，使用提供的数据，否则从localStorage读取
      const dataToBackup = data || {
        bookmarks: JSON.parse(localStorage.getItem('bookmark-tool-data') || '{}').bookmarks || [],
        folders: JSON.parse(localStorage.getItem('bookmark-tool-data') || '{}').folders || []
      };
      console.log('备份数据:', dataToBackup);
      return this.writeData(dataToBackup);
    } catch (error) {
      console.error('Failed to backup data:', error);
      return false;
    }
  }

  // 释放文件句柄
  public async release(): Promise<void> {
    this.fileHandle = null;
    this.clearAuthState();
    await this.clearFileHandleFromIDB();
  }

  // 清除授权状态
  private clearAuthState(): void {
    try {
      // 使用chrome.storage API清除授权状态
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        window.chrome.storage.local.remove(this.AUTH_STATE_KEY, () => {
          console.log('授权状态已从chrome.storage清除');
        });
      } else {
        // 非插件模式，使用localStorage
        localStorage.removeItem(this.AUTH_STATE_KEY);
        console.log('授权状态已从localStorage清除');
      }
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  }

  // 从IndexedDB清除文件句柄
  private async clearFileHandleFromIDB(): Promise<void> {
    try {
      const db = await this.initIDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.IDB_STORE], 'readwrite');
        const store = transaction.objectStore(this.IDB_STORE);
        const request = store.delete(this.IDB_KEY);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('文件句柄已从IndexedDB清除');
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to clear file handle from IndexedDB:', error);
    }
  }

  // 导入数据
  public async importFromFile(): Promise<StorageData | null> {
    try {
      // 请求用户选择文件
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ],
        excludeAcceptAllOption: true
      });

      // 读取文件内容
      const file = await handle.getFile();
      const content = await file.text();
      return JSON.parse(content) as StorageData;
    } catch (error) {
      console.error('Failed to import data from file:', error);
      return null;
    }
  }

  // 导出数据到文件
  public async exportToFile(data: StorageData): Promise<boolean> {
    try {
      // 请求用户选择保存位置
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `bookmarks-backup-${new Date().toISOString().slice(0, 10)}.json`,
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ],
        excludeAcceptAllOption: true
      });

      // 写入文件
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (error) {
      console.error('Failed to export data to file:', error);
      return false;
    }
  }
}