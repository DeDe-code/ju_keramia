<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
// Navigation links
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
    {
      label: 'Shipping & Returns',
      to: '/shipping',
    },
    {
      label: 'Privacy Policy',
      to: '/privacy',
    },
  ],
]);
</script>

<template>
  <footer class="w-full py-4 px-8 bg-clay-600 md:py-8 text-cream-25">
    <div class="max-w-7xl mx-auto">
      <!-- Main Footer Content -->
      <div class="flex flex-col justify-between gap-ceramic-md md:flex-row">
        <!-- Brand Section -->
        <div class="text-center md:text-left">
          <NuxtLink
            to="/"
            class="inline-block font-ceramic-mono text-2xl md:text-3xl font-semibold text-cream-25 hover:text-cream-100 transition-colors duration-200"
          >
            ju_keramia
          </NuxtLink>
        </div>

        <!-- Navigation Links -->
        <div class="flex flex-col gap-ceramic-md md:w-1/3 md:flex-row md:justify-between">
          <!-- Internal Links -->
          <div class="flex flex-col items-center md:items-start gap-y-3">
            <NuxtLink
              v-for="(item, index) in items[0]"
              :key="`nav-item-${index}`"
              :to="item.to"
              class="text-cream-200 hover:text-cream-25 transition-colors duration-200 text-sm md:text-base cursor-pointer"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
          <!-- Social & Contact -->
          <div class="flex flex-col gap-y-3">
            <!-- Social Media Links -->
            <a
              href="#"
              class="inline-flex items-center justify-center md:justify-start gap-2 text-cream-200 hover:text-cream-25 transition-colors duration-200"
              aria-label="Follow us on Instagram"
            >
              <span class="text-sm md:text-base">Instagram</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Footer Bottom -->
      <!-- <div class="border-t border-stone-500 pt-6 md:pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4"> -->
      <!-- Copyright -->
      <!-- <p class="text-cream-200 text-sm md:text-base text-center md:text-left">
            © 2025 ju_keramia. All rights reserved.
          </p> -->

      <!-- Additional Links (Mobile: Stack, Desktop: Inline) -->
      <!-- <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <NuxtLink
              to="/terms"
              class="text-cream-200 hover:text-cream-25 transition-colors duration-200 text-sm"
            >
              Terms of Service
            </NuxtLink>
            <NuxtLink
              to="/cookies"
              class="text-cream-200 hover:text-cream-25 transition-colors duration-200 text-sm"
            >
              Cookie Policy
            </NuxtLink> -->
      <!-- </div>
        </div>
      </div> -->
    </div>
  </footer>
</template>
