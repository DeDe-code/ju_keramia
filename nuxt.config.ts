// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxt/ui'],
  css: ['./app/assets/css/main.css'],

  // Configure Nuxt UI with our custom ceramic colors
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'neutral',
        'success',
        'info',
        'warning',
        'error',
        // Add our custom ceramic colors
        'cream',
        'clay',
        'stone',
        'sage',
      ],
    },
  },
});
