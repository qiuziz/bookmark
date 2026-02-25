import logger from './logger';
import { AppError, ErrorCodes } from '../types';

// 错误处理工具类
class ErrorHandler {
  // 创建标准化的错误对象
  createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details
    };
  }

  // 处理网络错误
  handleNetworkError(error: any): AppError {
    const appError = this.createError(
      ErrorCodes.NETWORK_ERROR,
      '网络请求失败，请检查网络连接',
      error
    );
    this.logError(appError);
    return appError;
  }

  // 处理存储错误
  handleStorageError(error: any): AppError {
    const appError = this.createError(
      ErrorCodes.STORAGE_ERROR,
      '存储操作失败，请检查存储空间',
      error
    );
    this.logError(appError);
    return appError;
  }

  // 处理解析错误
  handleParsingError(error: any): AppError {
    const appError = this.createError(
      ErrorCodes.PARSING_ERROR,
      '数据解析失败，请检查数据格式',
      error
    );
    this.logError(appError);
    return appError;
  }

  // 处理权限错误
  handlePermissionError(error: any): AppError {
    const appError = this.createError(
      ErrorCodes.PERMISSION_ERROR,
      '权限不足，请检查权限设置',
      error
    );
    this.logError(appError);
    return appError;
  }

  // 处理验证错误
  handleValidationError(message: string, details?: any): AppError {
    const appError = this.createError(
      ErrorCodes.VALIDATION_ERROR,
      message,
      details
    );
    this.logError(appError);
    return appError;
  }

  // 处理未知错误
  handleUnknownError(error: any): AppError {
    const appError = this.createError(
      ErrorCodes.UNKNOWN_ERROR,
      '未知错误，请稍后重试',
      error
    );
    this.logError(appError);
    return appError;
  }

  // 记录错误日志
  logError(error: AppError): void {
    logger.error('Error:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
  }

  // 包装异步操作，自动处理错误
  async wrapAsync<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error: any) {
      // 根据错误类型进行处理
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        return { data: null, error: this.handleNetworkError(error) };
      } else if (error.name === 'StorageError' || error.message.includes('storage')) {
        return { data: null, error: this.handleStorageError(error) };
      } else if (error.name === 'SyntaxError' || error.message.includes('parse')) {
        return { data: null, error: this.handleParsingError(error) };
      } else if (error.name === 'PermissionError' || error.message.includes('permission')) {
        return { data: null, error: this.handlePermissionError(error) };
      } else {
        return { data: null, error: this.handleUnknownError(error) };
      }
    }
  }

  // 生成用户友好的错误消息
  getFriendlyMessage(error: AppError): string {
    return error.message;
  }
}

// 导出单例实例
export default new ErrorHandler();
