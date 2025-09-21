export default defineAppConfig({
  ui: {
    colors: {
      // Map our ceramic colors to Nuxt UI color aliases
      primary: 'clay', // Main brand color (warm clay brown)
      secondary: 'sage', // Secondary color (sage green)
      neutral: 'stone', // Neutral grays for text/backgrounds
      success: 'sage', // Success states (sage green)
      info: 'stone', // Info states (neutral stone)
      warning: 'cream', // Warning states (warm cream)
      error: 'red', // Error states (keep default red)
    },
  },
});
