import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    }
  },
  ...({
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        include: ['src/stores/**', 'src/lib/**', 'src/components/layout/AppLayout.tsx'],
      },
    },
  } as any),
})
