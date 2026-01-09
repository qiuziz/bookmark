# 书签小工具浏览器插件

## 安装步骤

### Chrome浏览器
1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 启用右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist/plugin` 目录

### Edge浏览器
1. 打开Edge浏览器，访问 `edge://extensions/`
2. 启用左下角的「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `dist/plugin` 目录

## 功能特点
- 支持层次化文件夹结构管理书签
- 支持书签的添加、编辑、删除和置顶
- 支持文件夹的创建、重命名和删除
- 支持书签的导入和导出功能
- 响应式设计，适配不同屏幕尺寸

## 开发说明

### 构建项目
```bash
pnpm install
pnpm run build
```

构建后的文件将输出到 `dist/plugin` 目录。

### 本地开发
```bash
pnpm install
pnpm run dev
```

本地开发服务器将在 http://localhost:3000 启动。
