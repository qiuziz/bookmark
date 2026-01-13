// 环境常量定义
// 使用Vite的环境变量，以支持tree shaking优化

export const IS_PLUGIN = import.meta.env.VITE_PLUGIN === 'true';
export const BUILD_MODE = import.meta.env.MODE || 'development';
