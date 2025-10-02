import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['wouter'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
          
          // Feature-based chunks
          'pages-auth': [
            './src/pages/landing.tsx',
            './src/pages/home.tsx',
            './src/pages/profile.tsx'
          ],
          'pages-analysis': [
            './src/pages/analyze.tsx',
            './src/pages/batch-analyze.tsx',
            './src/pages/repository-detail.tsx',
            './src/pages/compare.tsx'
          ],
          'pages-discovery': [
            './src/pages/search.tsx',
            './src/pages/discover.tsx'
          ],
          'pages-business': [
            './src/pages/pricing.tsx',
            './src/pages/checkout.tsx',
            './src/pages/payment-success.tsx'
          ],
          'pages-advanced': [
            './src/pages/analytics.tsx',
            './src/pages/advanced-analytics.tsx',
            './src/pages/teams.tsx',
            './src/pages/collections.tsx'
          ],
          'pages-developer': [
            './src/pages/developer.tsx',
            './src/pages/integrations.tsx',
            './src/pages/code-review.tsx'
          ],
          'pages-info': [
            './src/pages/docs.tsx',
            './src/pages/not-found.tsx'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Enable tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : []
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV !== 'production'
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
