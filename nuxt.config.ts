// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@nuxt/icon'],
  css: ['./app/assets/css/main.css'],

  // Enable modern View Transitions API for smooth page transitions
  experimental: {
    viewTransition: true,
  },

  // Ensure icons are properly loaded for SSR
  nitro: {
    experimental: {
      wasm: true,
    },
  },

  // Global page transitions configuration
  app: {
    pageTransition: {
      name: 'ceramic',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'ceramic-layout',
      mode: 'out-in',
    },
  },

  ui: {
    colorMode: false,
  },

  // Nuxt Image configuration
  image: {
    // Configure IPX provider settings
    quality: 80,
    format: ['webp', 'avif', 'jpg'],
    // Enable local image optimization
    provider: 'ipx',
    // Configure domains for external images (if needed)
    domains: [],
  },

  // Icon configuration to prevent conflicts
  icon: {
    serverBundle: {
      collections: ['heroicons'], // Only bundle heroicons for SSR
    },
    clientBundle: {
      scan: true, // Scan components for used icons
      sizeLimitKb: 256, // Limit bundle size
    },
  },

  // Ensure proper build configuration for icons
  build: {
    transpile: ['@iconify/vue'],
  },
});
