<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { useMediaQuery } from '@vueuse/core';

// Responsive breakpoint detection - full screen for mobile and tablet
const _isMobileOrTablet = useMediaQuery('(max-width: 1023px)');

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Prevent body scroll when menu is open
watch(isMobileMenuOpen, (isOpen) => {
  if (import.meta.client) {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
});

// Navigation items without icons
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

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Close menu when route changes
const route = useRoute();
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  }
);

// Close menu when clicking outside (for tablet/desktop overlays)
const closeMenu = () => {
  console.log('Closing mobile menu');
  isMobileMenuOpen.value = false;
};

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  // Restore body scroll when component unmounts
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <div class="lg:hidden mt-3">
    <!-- Mobile Menu Trigger Button -->
    <ClientOnly>
      <UButton
        icon="i-heroicons-bars-3"
        size="lg"
        aria-label="Open menu"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobile-navigation"
        @click="toggleMobileMenu"
      />
      <template #fallback>
        <div class="w-12 h-12 bg-stone-200 rounded animate-pulse" />
      </template>
    </ClientOnly>

    <!-- Full Screen Navigation Overlay (Mobile & Tablet) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 transform translate-x-full"
        enter-to-class="opacity-100 transform translate-x-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0"
        leave-to-class="opacity-0 transform translate-x-full"
      >
        <div
          v-show="isMobileMenuOpen"
          class="fixed top-0 left-0 w-screen h-screen z-[999] bg-cream-25 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Background overlay -->
          <div
            class="absolute top-0 left-0 w-full h-full bg-cream-25 cursor-pointer"
            @click.stop="closeMenu"
          />

          <!-- Close Button in Top Right Corner -->
          <div class="absolute top-4 right-4 z-[1000]">
            <ClientOnly>
              <UButton
                icon="i-heroicons-x-mark"
                size="lg"
                aria-label="Close menu"
                @click.stop="closeMenu"
              />
              <template #fallback>
                <div class="w-12 h-12 bg-stone-200 rounded animate-pulse" />
              </template>
            </ClientOnly>
          </div>

          <!-- Navigation Content -->
          <div class="relative z-10 w-full h-screen flex flex-col items-center justify-center px-6">
            <nav
              id="mobile-navigation"
              class="w-full max-w-sm"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <!-- Simple Navigation Links -->
              <div class="space-y-6">
                <NuxtLink
                  v-for="(item, index) in items[0]"
                  :key="`nav-item-${index}`"
                  :to="item.to"
                  class="block text-center text-stone-700 hover:text-clay-800 text-2xl px-6 py-4 font-medium transition-all duration-200 w-full"
                  @click="closeMenu"
                >
                  {{ item.label }}
                </NuxtLink>
              </div>
            </nav>

            <!-- Social Links -->
            <div class="mt-12">
              <ClientOnly>
                <UButton icon="i-heroicons-camera" size="xl" aria-label="Instagram" />
                <template #fallback>
                  <div class="w-14 h-14 bg-stone-200 rounded animate-pulse" />
                </template>
              </ClientOnly>
            </div>

            <!-- Copyright -->
            <p class="text-center text-base text-stone-500 mt-8 font-medium">© 2025 ju_keramia</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* High contrast mode support */
@media (prefers-contrast: high) {
  .mobile-menu-item {
    border: 1px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
}
</style>
