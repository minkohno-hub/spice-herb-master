import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages ではリポジトリ名がベースパスになる
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/spice-herb-master/' : '/',
  plugins: [react()],
  test: { environment: 'node' },
});
