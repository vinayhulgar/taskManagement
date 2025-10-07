import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Production-optimized Vite configuration
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for security
    minify: 'terser',
    
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'lucide-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge'],
          'dnd-vendor': ['@hello-pangea/dnd'],
          'state-vendor': ['zustand'],
        },
        
        // Asset naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          if (/\.css$/i.test(assetInfo.name || '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@services': resolve(__dirname, './src/services'),
      '@stores': resolve(__dirname, './src/stores'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@lib': resolve(__dirname, './src/lib'),
    },
  },
  
  // CSS configuration
  css: {
    postcss: './postcss.config.cjs',
    devSourcemap: false, // Disable CSS source maps in production
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Server configuration (for preview)
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },
  
  // Environment variables
  envPrefix: 'VITE_',
  
  // Experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    },
  },
});