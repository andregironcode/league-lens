
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
            console.log('🔍 STARTING PROXY REQUEST TO HIGHLIGHTLY...');
            
            // Set all required headers directly before sending
            proxyReq.setHeader('Authorization', 'Bearer c05d22e5-9a84-4a95-83c7-77ef598647ed');
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            
            // Log the complete URL for debugging
            const fullUrl = `${req.method} http://${req.headers.host}${req.url} → ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
            console.log(`🚀 PROXY REQUEST: ${fullUrl}`);
            
            // FINAL HEADERS LOG - Verify all headers right before request is sent
            console.log('🔐 FINAL OUTGOING HEADERS TO HIGHLIGHTLY:');
            try {
              const headers: Record<string, string> = {};
              const headerNames = proxyReq.getHeaderNames();
              
              if (headerNames) {
                headerNames.forEach(name => {
                  const headerValue = proxyReq.getHeader(name);
                  if (headerValue !== undefined) {
                    headers[name] = headerValue.toString();
                  }
                });
                
                // Log in nicely formatted way
                Object.entries(headers).forEach(([name, value]) => {
                  console.log(`   ${name}: ${value}`);
                });
                
                // CRITICAL: Final verification for Authorization header
                if (headers['Authorization']) {
                  console.log('✅ FINAL CHECK - Authorization header is present');
                  console.log(`   Value: ${headers['Authorization']}`);
                } else {
                  console.error('❌ ERROR - Authorization header is MISSING in final check!');
                  
                  // Check if it's present with different casing
                  const authHeader = Object.keys(headers).find(key => key.toLowerCase() === 'authorization');
                  if (authHeader) {
                    console.log(`⚠️ WARNING - Found header with different casing: ${authHeader}: ${headers[authHeader]}`);
                  }
                }
              }
            } catch (err) {
              console.error('❌ Error logging headers:', err);
            }
          });
          
          proxy.on('proxyRes', function(proxyRes, req, _res) {
            // Get the status code safely
            const statusCode = proxyRes?.statusCode || 0;
            console.log(`🔄 PROXY RESPONSE: ${req.method} ${req.url} → ${statusCode}`);
            
            // Log response headers
            console.log('📋 Response headers from Highlightly:');
            Object.entries(proxyRes.headers).forEach(([name, value]) => {
              console.log(`   ${name}: ${value}`);
            });
            
            // For error responses, collect and log the response body
            if (statusCode >= 400) {
              let responseBody = '';
              proxyRes.on('data', (chunk) => {
                responseBody += chunk.toString('utf8');
              });
              
              proxyRes.on('end', () => {
                console.error(`❌ ERROR RESPONSE FROM HIGHLIGHTLY (${statusCode}): ${responseBody}`);
                
                // Additional log for 403 errors to help diagnose authorization issues
                if (statusCode === 403) {
                  console.error('🔑 AUTHORIZATION FAILURE: The API rejected our credentials. Check that:');
                  console.error('1. The Authorization header was correctly set to Bearer c05d22e5-9a84-4a95-83c7-77ef598647ed');
                  console.error('2. The token is still valid and has the correct permissions');
                  console.error('3. The Highlightly API expects additional authentication parameters');
                }
              });
            }
          });
          
          proxy.on('error', function(err, req, _res) {
            console.error('🔥 PROXY ERROR:', err);
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
