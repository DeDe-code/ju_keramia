import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:import/recommended',
    'plugin:security/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['vue', '@typescript-eslint', 'unicorn', 'import', 'security', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    // Add custom rules here if needed
  },
});
