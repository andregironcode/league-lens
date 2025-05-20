
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
          proxy.on('proxyReq', function(proxyReq, req, _res) {
            // Add the Authorization header with Bearer prefix to each request
            proxyReq.setHeader('Authorization', 'Bearer c05d22e5-9a84-4a95-83c7-77ef598647ed');
            
            // Log the complete outgoing request headers for debugging
            const headers = proxyReq.getHeaders();
            console.log('🔐 Proxy outgoing request headers to Highlightly:', 
              Object.fromEntries(Object.entries(headers))
            );
            
            console.log(`🚀 Forwarding ${req.method} ${req.url} to Highlightly`);
          });
          
          proxy.on('proxyRes', function(proxyRes, req, _res) {
            // Get the status code safely (it will be undefined if there's no response)
            const statusCode = proxyRes?.statusCode || 0;
            console.log(`🔄 Proxy response from Highlightly: ${req.method} ${req.url} -> ${statusCode}`);
            
            // Log response headers
            console.log('📋 Response headers:', proxyRes.headers);
            
            // For error responses, collect and log the response body
            if (statusCode >= 400) {
              let responseBody = '';
              proxyRes.on('data', (chunk) => {
                responseBody += chunk;
              });
              
              proxyRes.on('end', () => {
                console.error(`❌ Error response body from Highlightly (${statusCode}):`, responseBody);
              });
            }
          });
          
          proxy.on('error', function(err, req, _res) {
            console.error('🔥 Proxy error:', err);
            console.error(`Failed request: ${req.method} ${req.url}`);
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
