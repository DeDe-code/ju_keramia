<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Shop',
      to: '/shop',
    },
    {
      label: 'About',
      to: '/about',
    },
    {
      label: 'Contact',
      to: '/contact',
    },
  ],
]);
</script>

<template>
  <UNavigationMenu :items="items" />
</template>
