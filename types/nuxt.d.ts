/**
 * Nuxt Type Augmentations
 *
 * Extends Nuxt types for proper TypeScript support in plugins
 */

declare global {
  interface ImportMeta {
    client: boolean;
    server: boolean;
  }
}

export {};
