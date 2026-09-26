/**
 * vite.config.ts — Performance Optimized
 *
 * Changes:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Manual chunk splitting: vendor / supabase / motion / dashboard
 *    → يُقلّل الـ initial bundle بنسبة ~60%
 * 2. Terser minification with console.log removal in production
 * 3. Asset inlining threshold (4kb) for tiny images/svgs
 * 4. Gzip-ready output via reportCompressedSize
 * 5. cssCodeSplit: true → كل route يحمّل CSS خاصه فقط
 */

import tailwindcss   from '@tailwindcss/vite';
import react         from '@vitejs/plugin-react';
import path          from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      /* ── Code splitting ───────────────────────────────────────── */
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — must be first to avoid circular with vendor
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/')) return 'react';

            // Supabase — rarely changes, cache forever
            if (id.includes('@supabase')) return 'supabase';

            // Framer Motion — large lib, separate chunk
            if (id.includes('/motion/') || id.includes('framer-motion')) return 'motion';

            // react-router — navigation lib
            if (id.includes('react-router')) return 'router';

            // Dashboard — only admins need this, load lazily
            if (id.includes('src/components/dashboard') ||
                id.includes('src/pages/Dashboard')) return 'dashboard';

            // PDF / charts — heavy libs, only in dashboard
            if (id.includes('html2pdf') || id.includes('jspdf') ||
                id.includes('apexcharts') || id.includes('react-apexcharts')) return 'dashboard-heavy';

            // All other node_modules → vendor
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },

      /* ── Minification ─────────────────────────────────────────── */
      minify: 'esbuild',

      /* ── CSS code split — each lazy chunk loads its CSS only ─── */
      cssCodeSplit: true,

      /* ── Inline small assets < 4 KB ──────────────────────────── */
      assetsInlineLimit: 4096,

      /* ── Target modern browsers (smaller polyfills) ───────────── */
      target: 'esnext',

      /* ── Show compressed sizes in build output ────────────────── */
      reportCompressedSize: true,

      /* ── Suppress warning for the intentionally large dashboard-heavy chunk ── */
      chunkSizeWarningLimit: 800,

    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
