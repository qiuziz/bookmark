import { IS_PLUGIN, BUILD_MODE } from './env';

// 日志配置
interface LoggerConfig {
  debug: boolean;
}

// 默认日志配置
const defaultConfig: LoggerConfig = {
  debug: false
};

let currentConfig: LoggerConfig = { ...defaultConfig };

// 从localStorage加载配置（仅插件模式）
if (IS_PLUGIN) {
  try {
    const savedConfig = localStorage.getItem('bookmark-tool-logger-config');
    if (savedConfig) {
      currentConfig = { ...defaultConfig, ...JSON.parse(savedConfig) };
    }
  } catch (error) {
    console.error('加载日志配置失败:', error);
  }
}

// 保存配置到localStorage（仅插件模式）
const saveConfig = (config: LoggerConfig) => {
  if (IS_PLUGIN) {
    try {
      localStorage.setItem('bookmark-tool-logger-config', JSON.stringify(config));
      currentConfig = { ...currentConfig, ...config };
    } catch (error) {
      console.error('保存日志配置失败:', error);
    }
  }
};

// 检查是否应该输出日志
const shouldLog = () => {
  if (IS_PLUGIN) {
    return currentConfig.debug;
  } else {
    return BUILD_MODE === 'development';
  }
};

// 日志工具类
const logger = {
  // 配置相关方法
  setDebug(debug: boolean) {
    saveConfig({ debug });
  },
  
  getDebug() {
    return currentConfig.debug;
  },
  
  // 日志方法
  log(...args: any[]) {
    if (shouldLog()) {
      console.log('[Bookmark Tool]', ...args);
    }
  },
  
  info(...args: any[]) {
    if (shouldLog()) {
      console.info('[Bookmark Tool]', ...args);
    }
  },
  
  warn(...args: any[]) {
    if (shouldLog()) {
      console.warn('[Bookmark Tool]', ...args);
    }
  },
  
  error(...args: any[]) {
    if (shouldLog()) {
      console.error('[Bookmark Tool]', ...args);
    }
  },
  
  debug(...args: any[]) {
    if (shouldLog()) {
      console.debug('[Bookmark Tool]', ...args);
    }
  }
};

export default logger;
