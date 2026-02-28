import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectManifest: {
          swDest: 'dist/sw.js',
        },
        manifest: {
          name: 'LeadFlow CRM',
          short_name: 'LeadFlow',
          theme_color: '#4f46e5',
          icons: [
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env': env // Safe env access
    },
    server: {
      port: 3000,
      proxy: {
        '/supabase': {
          target: 'https://vewqzsqddgmkslnuctvb.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase/, ''),
          secure: true,
        }
      }
    }
  };
});
