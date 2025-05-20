
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://soccer.highlightly.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', function(proxyReq, _req, _res) {
            // Add the Authorization header to each request
            proxyReq.setHeader('Authorization', 'Bearer c05d22e5-9a84-4a95-83c7-77ef598647ed');
          });
          
          proxy.on('proxyRes', function(proxyRes, req, _res) {
            console.log(`🔄 Proxy: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          });
          
          proxy.on('error', function(err, _req, _res) {
            console.error('🔥 Proxy error:', err);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
