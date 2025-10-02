<script setup lang="ts">
// SEO and meta configuration
useSeoMeta({
  title: 'About | Ju Keramia - Handcrafted Ceramics',
  description:
    'Meet the artisan behind Ju Keramia. Discover the passion and craftsmanship that goes into every handmade ceramic piece.',
  ogTitle: 'About Ju Keramia - Ceramic Artist & Potter',
  ogDescription:
    'Learn about the ceramic artist behind Ju Keramia and the story of handcrafted pottery made with love and tradition.',
  ogImage: '/image/profile-picture.jpg',
});
</script>

<template>
  <div class="min-h-screen bg-cream-25 py-ceramic-xl px-ceramic-md">
    <div class="max-w-6xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-ceramic-xl">
        <!-- Text Content -->
        <div class="space-y-ceramic-lg">
          <!-- Heading -->
          <div class="space-y-ceramic-sm">
            <h1 class="font-ceramic-display text-ceramic-4xl text-clay-950 mb-ceramic-md">
              about.
            </h1>

            <!-- Introduction -->
            <p class="text-stone-600 leading-relaxed">
              Welcome! I am Zsuzsi, scenographer, event designer at @monogramweddings and explorer
              of the clay. Made by hand, rooted in Transylvania.
            </p>
            <p class="text-stone-600 leading-relaxed">
              For me, shaping clay is a creative journey through which I can both reveal and conceal
              aspects of myself. I love exploring the material, as it continually offers new
              possibilities to challenge the boundaries of form and technique. I believe in using
              controlled randomness, which allows the material to display its personality .
            </p>
          </div>
        </div>

        <!-- Profile Image -->
        <div class="order-first lg:order-last">
          <div class="relative mx-auto lg:max-w-none">
            <NuxtImg
              src="/image/profile-picture.jpg"
              alt="Portrait of Zsuzsi, ceramic artist and founder of Ju Keramia"
              format="webp"
              quality="85"
              loading="lazy"
              width="600"
              height="800"
              class="w-full h-auto shadow-lg object-cover"
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 70vw, (max-width: 1024px) 50vw, 600px"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
