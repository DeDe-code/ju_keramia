// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
  css: ['./app/assets/css/main.css'],

  // Runtime configuration for API keys
  runtimeConfig: {
    // Private keys (only available on server-side)
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    hcaptchaSecretKey: process.env.NUXT_HCAPTCHA_SECRET_KEY,
    resendToEmail: process.env.NUXT_RESEND_TO_EMAIL || 'hello@jukeramia.com',
    resendFromEmail: process.env.NUXT_RESEND_FROM_EMAIL || 'contact@jukeramia.com',
    //CLOUDFLARE CREDENTIALS:
    cloudflareAccountId: process.env.NUXT_CLOUDFLARE_ACCOUNT_ID,
    cloudflareAccessKeyId: process.env.NUXT_CLOUDFLARE_ACCESS_KEY_ID,
    cloudflareSecretAccessKey: process.env.NUXT_CLOUDFLARE_SECRET_ACCESS_KEY,
    cloudflareBucketName: process.env.NUXT_CLOUDFLARE_BUCKET_NAME,
    // Public keys (exposed to client-side)
    public: {
      hcaptchaSiteKey: process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      cloudflarePublicUrl: process.env.NUXT_PUBLIC_CLOUDFLARE_PUBLIC_URL,
    },
  },

  // Route rules for redirects and optimization
  routeRules: {
    '/admin/hero-images': { redirect: '/admin/hero-images/landing' },
    // Aggressive caching for images from Cloudflare R2
    // This reduces Class B operations (reads) on R2
    '/_ipx/**': {
      headers: {
        'Cache-Control': 'public, max-age=2592000, immutable', // 30 days
      },
    },
    // Cache static assets
    '/image/**': {
      headers: {
        'Cache-Control': 'public, max-age=2592000, immutable', // 30 days
      },
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
    quality: 75, // Reduced quality for better compression (was 80)
    format: ['webp', 'avif', 'jpg'],
    // Enable local image optimization
    provider: 'ipx',
    // Configure domains for external images
    domains: ['cdn.jukeramia.com'],
    // IPX configuration with aggressive caching
    ipx: {
      maxAge: 60 * 60 * 24 * 30, // 30 days browser cache (increased from 7 days)
      // Cloudflare R2 caching strategy:
      // - Browser cache: 30 days
      // - CDN edge cache: Set via Cloudflare Cache Rules
      // - This reduces R2 read operations (Class B operations)
    },
    // Presets for different image types to optimize Cloudflare R2 usage
    presets: {
      // Product images in admin carousel (small thumbnails)
      productThumb: {
        modifiers: {
          format: 'webp',
          quality: 70,
          width: 400,
          height: 400,
          fit: 'cover',
        },
      },
      // Product images in shop (larger display)
      productDisplay: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 800,
          height: 800,
          fit: 'cover',
        },
      },
      // Hero images
      hero: {
        modifiers: {
          format: 'webp',
          quality: 85,
          width: 1920,
          height: 1080,
          fit: 'cover',
        },
      },
    },
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
