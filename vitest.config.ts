import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@main': resolve('src/main'),
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared')
    }
  },
  test: {
    environment: 'jsdom',
    globals: false,
    pool: 'threads',
    fileParallelism: false,
    testTimeout: 20000,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95
      },
      include: [
        'src/main/**/*.ts',
        'src/preload/**/*.ts',
        'src/renderer/src/**/*.ts',
        'src/renderer/src/**/*.tsx',
        'src/shared/**/*.ts'
      ],
      exclude: [
        'src/main/index.ts',
        'src/main/services/logcat/logcat-session-manager.ts',
        'src/renderer/src/App.tsx',
        'src/renderer/src/main.tsx',
        'src/renderer/src/vite-env.d.ts',
        'src/renderer/src/index.css',
        'src/renderer/src/components/actions-modal.tsx',
        'src/renderer/src/components/app-sidebar.tsx',
        'src/renderer/src/components/command-bar.tsx',
        'src/renderer/src/components/device-modal.tsx',
        'src/renderer/src/components/empty-state.tsx',
        'src/renderer/src/components/log-console.tsx',
        'src/renderer/src/components/modal-shell.tsx',
        'src/renderer/src/components/settings-modal.tsx',
        'src/renderer/src/hooks/use-app-bootstrap.ts',
        'src/renderer/src/hooks/use-logcat-events.ts'
      ]
    }
  }
});
