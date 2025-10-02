<script setup lang="ts"></script>
<template>
  <div
    class="w-full flex justify-between items-center mx-auto px-ceramic-lg sm:px-ceramic-xl lg:px-ceramic-3xl py-ceramic-lg"
  >
    <!-- Mobile: Mobile Menu + Logo -->
    <div class="flex items-center lg:hidden">
      <LayoutAppMobileNavigation />
      <NuxtLink
        to="/"
        class="ml-ceramic-md font-ceramic-mono text-ceramic-3xl text-clay-950 font-semibold"
      >
        ju_keramia
      </NuxtLink>
    </div>

    <!-- Desktop: Social Icons (hidden on mobile) -->
    <div class="hidden lg:block">
      <CommonSocialIconsWrapper />
    </div>

    <!-- Desktop: Navigation (hidden on mobile) -->
    <div class="hidden lg:block">
      <LayoutHeaderNavigationWrapper />
    </div>

    <!-- Cart Icon (always visible) -->
    <CommonCartIconWrapper />
  </div>
</template>
