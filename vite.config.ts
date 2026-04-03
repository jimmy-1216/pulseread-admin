import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2015',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // 修复循环依赖：将 ant-design 和 icons 合并为单独的 chunk
          'ant-design-vue': ['ant-design-vue', '@ant-design/icons-vue'],
          // echarts 单独打包
          'echarts': ['echarts'],
          // 核心框架库
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 工具库
          'utils': ['axios', 'dayjs'],
        },
      },
    },
    // 提高 chunk 大小警告阈值至 1500 kB（ant-design-vue 和 echarts 较大是正常的）
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'primary-color': '#00B96B',
        },
        javascriptEnabled: true,
      },
    },
  },
})
