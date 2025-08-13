import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/tests/**', '**/e2e/**', '**/playwright/**', '**/*.spec.ts'],
    include: ['**/src/**/*.test.{ts,tsx}', '**/src/**/__tests__/**/*.{ts,tsx}'],
    coverage: {
      exclude: [
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/test-setup.ts',
        '**/vitest.config.*',
        '**/playwright.config.*',
        '**/tailwind.config.*',
        '**/postcss.config.*',
        '**/vite.config.*'
      ]
    }
  },
});