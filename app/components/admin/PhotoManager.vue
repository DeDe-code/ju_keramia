<script setup lang="ts">
/**
 * Navigation wrapper for hero image management pages.
 * Provides vertical menu with slot for page content.
 */

import type { NavigationMenuItem } from '@nuxt/ui';
import { HERO_IMAGE_PAGES } from '~~/config/heroImagePages';

const navigationItems: NavigationMenuItem[][] = [
  HERO_IMAGE_PAGES.map((page) => ({
    label: page.label,
    icon: page.icon,
    description: page.description,
    to: page.path,
  })),
];
</script>

<template>
  <div class="w-full">
    <div class="mb-ceramic-lg">
      <h3 class="font-ceramic-display text-ceramic-2xl text-clay-800 mb-ceramic-xs">Hero Images</h3>
      <p class="text-ceramic-base text-stone-600">
        Manage hero images for landing and about pages. Recommended size: 1920x1080px
      </p>
    </div>

    <div class="grid grid-cols-12 gap-ceramic-lg">
      <!-- Navigation sidebar -->
      <div class="col-span-12 md:col-span-3">
        <UNavigationMenu
          orientation="vertical"
          color="neutral"
          :items="navigationItems"
          class="w-full"
        />
      </div>

      <!-- Page content slot -->
      <div class="col-span-12 md:col-span-9">
        <slot />
      </div>
    </div>
  </div>
</template>
