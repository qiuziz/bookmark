import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode, env = {} }) => {
  const vitePluginValue = env.VITE_PLUGIN || process.env.VITE_PLUGIN || ''
  const isPlugin = String(vitePluginValue).toLowerCase() === 'true'
  
  return {
    plugins: [
      react(),
      {
        name: 'generate-manifest',
        closeBundle() {
          if (isPlugin) {
            // 生成 manifest.json
            const templatePath = resolve(__dirname, 'manifest.json.template')
            const manifestPath = resolve(__dirname, 'dist/plugin/manifest.json')
            const manifestContent = readFileSync(templatePath, 'utf-8')
            writeFileSync(manifestPath, manifestContent)
            
            // 复制 service-worker.js
            const swPath = resolve(__dirname, 'service-worker.js')
            const swDestPath = resolve(__dirname, 'dist/plugin/service-worker.js')
            copyFileSync(swPath, swDestPath)
          }
        }
      }
    ],
    server: {
      port: 3000,
      open: true
    },
    appType: 'spa',
    base: isPlugin ? './' : '/bookmark',
    build: {
      outDir: isPlugin ? 'dist/plugin' : 'dist/bookmark-tool'
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern'
        }
      }
    }
  }
})