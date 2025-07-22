import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Validate required environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ]
  
  const missingVars = requiredEnvVars.filter(key => !env[key])
  if (missingVars.length > 0 && mode !== 'test') {
    console.error('\n❌ Missing required environment variables:')
    missingVars.forEach(key => console.error(`   - ${key}`))
    console.error('\n📝 Please check your .env file\n')
    process.exit(1)
  }

  return {
    plugins: [
      react({
        // Fix React 18/19 compatibility issues
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            // Add any babel plugins if needed
          ]
        }
      }),
      tailwindcss(),
      // Bundle visualization (only in analyze mode)
      process.env.ANALYZE && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    server: {
      port: 3000,
      open: true,
      cors: true,
      proxy: {
        // Proxy API requests to backend during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8082',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      
      // Minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      
      rollupOptions: {
        output: {
          // Optimize chunk splitting
          manualChunks: (id) => {
            // Split node_modules
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor'
              }
              // UI libraries
              if (id.includes('@radix-ui') || id.includes('framer-motion')) {
                return 'ui-vendor'
              }
              // Firebase
              if (id.includes('firebase')) {
                return 'firebase-vendor'
              }
              // Charts
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts-vendor'
              }
              // Other large dependencies
              if (id.includes('browser-image-compression')) {
                return 'image-vendor'
              }
              // Everything else from node_modules
              return 'vendor'
            }
            
            // Split app code
            if (id.includes('src/pages/')) {
              const pageName = id.split('src/pages/')[1].split('/')[0].replace('.jsx', '')
              return `page-${pageName}`
            }
            
            if (id.includes('src/components/')) {
              return 'components'
            }
          },
          
          // Asset naming
          assetFileNames: (assetInfo) => {
            const extType = path.extname(assetInfo.name).slice(1)
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/woff2?|ttf|otf|eot/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
          
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js'
        },
        
        // External dependencies (if needed)
        external: [],
        
        // Tree-shake unused code
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      
      // Enable CSS code splitting
      cssCodeSplit: true,
      
      // Preload directives
      modulePreload: {
        polyfill: true
      }
    },
    
    define: {
      // Define global variables for better compatibility
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    
    optimizeDeps: {
      // Pre-bundle dependencies for faster dev server startup
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        'react-hot-toast',
        'date-fns',
        'browser-image-compression',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-tabs',
        '@radix-ui/react-select',
        '@radix-ui/react-progress',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage'
      ],
      // Exclude problematic packages from optimization
      exclude: [],
      
      // Force optimization in dev
      force: mode === 'development'
    },
    
    esbuild: {
      // Configure esbuild for better performance
      target: 'es2020',
      logOverride: { 
        'this-is-undefined-in-esm': 'silent' 
      },
      treeShaking: true
    },
    
    // Preview server configuration
    preview: {
      port: 4173,
      open: true,
      cors: true
    }
  }
})