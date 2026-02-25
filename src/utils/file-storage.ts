import { StorageData } from '../types';
import logger from './logger';

// 添加File System Access API的类型定义
declare global {
  interface Window {
    showOpenFilePicker: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
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

  interface FilePickerOptions {
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
    suggestedName?: string;
  }

  // 扩展FileSystemFileHandle类型定义，确保包含我们需要的方法
  interface FileSystemFileHandle {
    queryPermission(options?: { mode: 'read' | 'readwrite' }): Promise<string>;
    requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<string>;
    getFile(): Promise<File>;
    createWritable(options?: any): Promise<FileSystemWritableFileStream>;
  }

  // 扩展FileSystemWritableFileStream类型定义
  interface FileSystemWritableFileStream {
    write(data: string | ArrayBuffer | Blob): Promise<void>;
    close(): Promise<void>;
  }
}

export class FileStorage {
  private static instance: FileStorage;
  private fileHandle: FileSystemFileHandle | null = null;
  private readonly AUTH_STATE_KEY = 'bookmark-tool-file-auth-state';
  private readonly IDB_NAME = 'bookmark-tool-db';
  private readonly IDB_STORE = 'file-handles';
  private readonly IDB_KEY = 'bookmarks-file';

  private constructor() { }

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
      // 检查授权状态
      const isAuthStateValid = await this.checkAuthState();
      if (!isAuthStateValid) {
        return false;
      }

      // 检查IndexedDB中是否有文件句柄
      const handle = await this.loadFileHandleFromIDB();
      if (!handle) {
        return false;
      }

      // 检查是否为FileSystemFileHandle对象
      if (typeof handle.kind !== 'string') {
        return false;
      }

      // 验证文件句柄权限 (不自动请求权限，避免因为没有用户手势导致报错)
      return await this.verifyFileHandlePermission(handle, false);
    } catch (error) {
      logger.error('检查授权状态失败:', error);
      return false;
    }
  }

  // 检查是否已经配置过存储（存在文件句柄）但可能未授权
  public async hasConfiguredStorage(): Promise<boolean> {
    try {
      const isAuthStateValid = await this.checkAuthState();
      if (!isAuthStateValid) {
        return false;
      }

      const handle = await this.loadFileHandleFromIDB();
      if (!handle) {
        return false;
      }

      return typeof handle.kind === 'string';
    } catch (error) {
      return false;
    }
  }

  // 恢复文件访问授权（需要用户点击触发）
  public async restoreAuthorization(): Promise<boolean> {
    try {
      const handle = await this.loadFileHandleFromIDB();
      if (!handle || typeof handle.kind !== 'string') {
        return false;
      }

      // 尝试请求权限
      const isGranted = await this.verifyFileHandlePermission(handle, true);
      if (isGranted) {
        this.fileHandle = handle;
        return true;
      }
      return false;
    } catch (error) {
      logger.error('恢复文件访问授权失败:', error);
      return false;
    }
  }

  // 检查授权状态
  private async checkAuthState(): Promise<boolean> {
    try {
      // 使用chrome.storage API检查授权状态
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        const result = await new Promise<{ [key: string]: any }>((resolve) => {
          window.chrome!.storage.local.get(this.AUTH_STATE_KEY, (data: any) => {
            resolve(data as { [key: string]: any });
          });
        });
        return result && result[this.AUTH_STATE_KEY] === true;
      } else {
        // 非插件模式，使用localStorage
        const stored = localStorage.getItem(this.AUTH_STATE_KEY);
        return stored === 'true';
      }
    } catch (error) {
      logger.error('检查授权状态失败:', error);
      return false;
    }
  }

  // 验证文件句柄权限
  private async verifyFileHandlePermission(handle: FileSystemFileHandle, autoRequest: boolean = false): Promise<boolean> {
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        // 如果权限是prompt，且明确允许请求（必须在用户手势下调用）
        if (permission === 'prompt' && autoRequest) {
          const requestPermission = await handle.requestPermission({ mode: 'readwrite' });
          return requestPermission === 'granted';
        }
        return false;
      }
      return true;
    } catch (error) {
      logger.error('验证文件句柄权限失败:', error);
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
          db.createObjectStore(this.IDB_STORE);
        }
      };
    });
  }

  // 从IndexedDB加载文件句柄
  private async loadFileHandleFromIDB(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.initIDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([this.IDB_STORE], 'readonly');
        const store = transaction.objectStore(this.IDB_STORE);
        const request = store.get(this.IDB_KEY);

        request.onerror = () => {
          logger.error('从IndexedDB加载文件句柄失败:', request.error);
          resolve(null);
        };
        request.onsuccess = () => {
          const handle = request.result as FileSystemFileHandle | undefined;
          resolve(handle || null);
        };
      });
    } catch (error) {
      logger.error('从IndexedDB加载文件句柄失败:', error);
      return null;
    }
  }

  // 保存文件句柄到IndexedDB
  private async saveFileHandleToIDB(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await this.initIDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.IDB_STORE], 'readwrite');
        const store = transaction.objectStore(this.IDB_STORE);

        // 先删除旧的文件句柄
        const deleteRequest = store.delete(this.IDB_KEY);
        deleteRequest.onsuccess = () => {
          // 然后添加新的文件句柄
          const addRequest = store.add(handle, this.IDB_KEY);

          addRequest.onerror = () => {
            logger.error('添加文件句柄失败:', addRequest.error);
            reject(addRequest.error);
          };

          addRequest.onsuccess = () => {
            resolve();
          };
        };

        deleteRequest.onerror = () => {
          logger.error('删除文件句柄失败:', deleteRequest.error);
          // 如果删除失败，继续尝试添加
          const addRequest = store.add(handle, this.IDB_KEY);

          addRequest.onerror = () => {
            logger.error('添加文件句柄失败:', addRequest.error);
            reject(addRequest.error);
          };

          addRequest.onsuccess = () => {
            resolve();
          };
        };
      });
    } catch (error) {
      logger.error('保存文件句柄到IndexedDB失败:', error);
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
        logger.error('保存文件句柄失败，取消授权:', error);
        this.fileHandle = null;
        return false;
      }
    } catch (error) {
      logger.error('文件访问授权失败:', error);
      return false;
    }
  }

  // 保存授权状态到chrome.storage或localStorage
  private saveAuthState(): void {
    try {
      // 使用chrome.storage API保存授权状态
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        window.chrome.storage.local.set({ [this.AUTH_STATE_KEY]: true });
      } else {
        // 非插件模式，使用localStorage
        localStorage.setItem(this.AUTH_STATE_KEY, 'true');
      }
    } catch (error) {
      logger.error('保存授权状态失败:', error);
    }
  }

  // 读取数据
  public async readData(): Promise<StorageData | null> {
    try {
      // 如果没有文件句柄，尝试从IndexedDB加载
      if (!this.fileHandle) {
        const loadedHandle = await this.loadFileHandleFromIDB();
        if (loadedHandle) {
          this.fileHandle = loadedHandle;
        } else {
          return null;
        }
      }

      // 验证权限
      const permission = await this.fileHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        return null;
      }

      // 读取文件内容
      const file = await this.fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content) as StorageData;
    } catch (error) {
      logger.error('从文件读取数据失败:', error);
      return null;
    }
  }

  // 写入数据
  public async writeData(data: StorageData): Promise<boolean> {
    try {
      // 如果没有文件句柄，尝试从IndexedDB加载
      if (!this.fileHandle) {
        const loadedHandle = await this.loadFileHandleFromIDB();
        if (loadedHandle) {
          this.fileHandle = loadedHandle;
        } else {
          return false;
        }
      }

      // 验证权限
      const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        return false;
      }

      // 写入文件
      const writable = await this.fileHandle.createWritable();
      const dataStr = JSON.stringify(data, null, 2);
      await writable.write(dataStr);
      await writable.close();
      return true;
    } catch (error) {
      logger.error('写入数据到文件失败:', error);
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
      return this.writeData(dataToBackup);
    } catch (error) {
      logger.error('备份数据失败:', error);
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
        window.chrome.storage.local.remove(this.AUTH_STATE_KEY);
      } else {
        // 非插件模式，使用localStorage
        localStorage.removeItem(this.AUTH_STATE_KEY);
      }
    } catch (error) {
      logger.error('清除授权状态失败:', error);
    }
  }

  // 从IndexedDB清除文件句柄
  private async clearFileHandleFromIDB(): Promise<void> {
    try {
      const db = await this.initIDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([this.IDB_STORE], 'readwrite');
        const store = transaction.objectStore(this.IDB_STORE);
        const request = store.delete(this.IDB_KEY);

        request.onerror = () => {
          logger.error('从IndexedDB清除文件句柄失败:', request.error);
          resolve();
        };
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      logger.error('从IndexedDB清除文件句柄失败:', error);
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
      logger.error('从文件导入数据失败:', error);
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
      logger.error('导出数据到文件失败:', error);
      return false;
    }
  }
}