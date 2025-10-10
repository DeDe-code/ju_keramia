// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@nuxt/icon', '@nuxtjs/google-fonts'],
  css: ['./app/assets/css/main.css'],

  // Runtime configuration for API keys
  runtimeConfig: {
    // Private keys (only available on server-side)
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    hcaptchaSecretKey: process.env.NUXT_HCAPTCHA_SECRET_KEY,
    resendToEmail: process.env.NUXT_RESEND_TO_EMAIL || 'hello@jukeramia.com',
    resendFromEmail: process.env.NUXT_RESEND_FROM_EMAIL || 'contact@jukeramia.com',
    // Public keys (exposed to client-side)
    public: {
      hcaptchaSiteKey: process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY,
    },
  },

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

  // Google Fonts configuration for ceramic design system
  googleFonts: {
    families: {
      // Sans-serif font for body text
      Inter: ['300', '400', '500', '600', '700'],
      // Serif font for alternative text
      'Crimson Text': {
        wght: ['400', '600'],
        ital: ['400'],
      },
      // Display font for headings and titles
      'Playfair Display': {
        wght: ['400', '500', '600', '700'],
        ital: ['400'],
      },
      // Monospace font for code and technical text
      'Cutive Mono': ['400'],
    },
    display: 'swap', // Improves loading performance
    preload: true, // Preloads fonts for better performance
  },

  // Ensure proper build configuration for icons
  build: {
    transpile: ['@iconify/vue'],
  },
});
