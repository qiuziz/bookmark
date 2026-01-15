import { Bookmark, Folder } from '../types';

// 添加File System Access API的类型定义
declare global {
  interface Window {
    showOpenFilePicker: (options?: any) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker: (options?: any) => Promise<FileSystemFileHandle>;
  }
  
  interface FileSystemFileHandle {
    queryPermission: (options?: { mode: 'read' | 'readwrite' }) => Promise<string>;
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
  private backupInterval: number | null = null;
  private backupIntervalMs = 5 * 60 * 1000; // 5分钟备份一次
  private readonly STORAGE_KEY = 'bookmark-tool-file-storage';

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
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const { fileHandle } = JSON.parse(stored) as { fileHandle: any };
      if (!fileHandle) return false;

      // 验证文件句柄是否仍然有效
      return await fileHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
    } catch {
      return false;
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
      this.saveFileHandle();
      this.startAutoBackup();
      return true;
    } catch (error) {
      console.error('File access authorization failed:', error);
      return false;
    }
  }

  // 保存文件句柄到localStorage
  private saveFileHandle(): void {
    if (!this.fileHandle) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        fileHandle: this.fileHandle
      }));
    } catch (error) {
      console.error('Failed to save file handle:', error);
    }
  }

  // 从localStorage加载文件句柄
  private async loadFileHandle(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const { fileHandle } = JSON.parse(stored) as { fileHandle: any };
      if (!fileHandle) return false;

      // 验证文件句柄是否仍然有效
      const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') return false;

      this.fileHandle = fileHandle;
      this.startAutoBackup();
      return true;
    } catch (error) {
      console.error('Failed to load file handle:', error);
      return false;
    }
  }

  // 读取数据
  public async readData(): Promise<StorageData | null> {
    try {
      // 如果没有文件句柄，尝试从localStorage加载
      if (!this.fileHandle && !(await this.loadFileHandle())) {
        console.error('没有文件句柄且无法加载');
        return null;
      }

      if (!this.fileHandle) {
        console.error('文件句柄为空');
        return null;
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
      // 如果没有文件句柄，尝试从localStorage加载
      if (!this.fileHandle && !(await this.loadFileHandle())) {
        console.error('没有文件句柄且无法加载');
        return false;
      }

      if (!this.fileHandle) {
        console.error('文件句柄为空');
        return false;
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
  public async backupData(): Promise<boolean> {
    return this.writeData({
      bookmarks: JSON.parse(localStorage.getItem('bookmark-tool-data') || '{}').bookmarks || [],
      folders: JSON.parse(localStorage.getItem('bookmark-tool-data') || '{}').folders || []
    });
  }

  // 开始自动备份
  private startAutoBackup(): void {
    // 清除现有的备份定时器
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // 设置新的备份定时器
    this.backupInterval = setInterval(async () => {
      await this.backupData();
    }, this.backupIntervalMs);
  }

  // 停止自动备份
  public stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  // 释放文件句柄
  public async release(): Promise<void> {
    this.stopAutoBackup();
    this.fileHandle = null;
    localStorage.removeItem(this.STORAGE_KEY);
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