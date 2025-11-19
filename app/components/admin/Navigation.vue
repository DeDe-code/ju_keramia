<script setup lang="ts">
/**
 * Admin navigation menu for switching between Hero Images and Products sections.
 */

import type { NavigationMenuItem } from '@nuxt/ui';

const items = ref<NavigationMenuItem[][]>([
  [
    {
      name: 'hero-images',
      label: 'Hero Images',
      icon: 'i-heroicons-photo',
      description: 'Manage landing and about page hero images',
      to: '/admin/hero-images',
    },
    {
      name: 'products',
      label: 'Products',
      icon: 'i-heroicons-cube',
      description: 'Manage product catalog and images',
      to: '/admin/products',
    },
  ],
]);
</script>

<template>
  <UNavigationMenu color="neutral" :items="items" class="w-full" />
</template>
