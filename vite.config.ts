import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        // 🚀 MINIMAL SW: No Workbox caching, only push notifications
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectManifest: {
          swDest: 'dist/sw.js',
          // 🔥 CRITICAL: Don't inject ANY precache manifest entries
          // This prevents Workbox from registering fetch handlers
          injectionPoint: undefined,
        },
        manifest: {
          name: 'LeadFlow CRM - Automated Lead Distribution',
          short_name: 'LeadFlow',
          description: 'Automated Lead Distribution & CRM System for teams. Distribute Facebook leads automatically, track conversions, and manage your sales pipeline.',
          theme_color: '#6366f1',
          background_color: '#ffffff',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          id: '/',
          lang: 'en',
          dir: 'ltr',
          categories: ['business', 'productivity'],
          prefer_related_applications: false,
          icons: [
            { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
          screenshots: [
            {
              src: 'screenshot-dashboard.png',
              sizes: '1024x1024',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Dashboard - Track leads, daily stats, and team performance'
            },
            {
              src: 'screenshot-leads.png',
              sizes: '1024x1024',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Lead Details - Manage contacts, call, and track conversions'
            }
          ],
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Home',
              description: 'View your lead dashboard and daily stats',
              url: '/dashboard',
              icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }]
            },
            {
              name: 'My Leads',
              short_name: 'Leads',
              description: 'View and manage your assigned leads',
              url: '/leads',
              icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }]
            }
          ],
          handle_links: 'preferred',
          launch_handler: { client_mode: 'navigate-existing' }
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
