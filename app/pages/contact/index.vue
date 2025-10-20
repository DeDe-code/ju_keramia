<script setup lang="ts">
import useContactFormValidation from '~~/composables/useContactFormValidation';

// SEO and meta configuration
useSeoMeta({
  title: 'Contact | Ju Keramia - Get in Touch',
  description:
    'Contact Ju Keramia for custom ceramic pieces, collaborations, or inquiries. Get in touch for bespoke tableware and artistic ceramic creations.',
  ogTitle: 'Contact Ju Keramia - Custom Ceramics & Collaborations',
  ogDescription:
    'Interested in a collaboration? Fancy some tableware for your café or restaurant, or even a bespoke dinner set for your home?',
  ogImage: '/image/contact-image.jpg',
});

// Use contact form validation composable
const { form, loading, submitted, submitError, schema, handleSubmit, initializeCaptcha } =
  useContactFormValidation();

// Initialize hCaptcha widget when component mounts
onMounted(async () => {
  await initializeCaptcha();
});
</script>

<template>
  <div class="min-h-screen bg-cream-25 py-ceramic-xl px-ceramic-md">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-2 gap-ceramic-xl items-center">
        <!-- Image Section -->
        <div class="order-first lg:order-first">
          <div class="relative mt-ceramic-xs">
            <NuxtImg
              src="/image/contact-image.jpg"
              alt="Handcrafted ceramic bowls showcasing the artisanal craftsmanship of Ju Keramia"
              format="webp"
              quality="85"
              loading="lazy"
              width="600"
              height="600"
              class="w-full md:min-h-[615px] shadow-lg object-cover"
            />
          </div>
        </div>

        <!-- Form Section -->
        <div>
          <!-- Heading -->
          <div class="mb-ceramic-md">
            <h1 class="font-ceramic-display text-ceramic-4xl text-clay-950 mb-ceramic-sm">
              contact.
            </h1>

            <p class="text-stone-600 leading-relaxed">
              Interested in a collaboration? Fancy some tableware for your café or restaurant, or
              even a bespoke dinner set for your home? Fill in the form below and let's get
              designing and making together.
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="submitError && !submitted"
            class="bg-red-50 border border-red-200 rounded-ceramic-md p-ceramic-md mb-ceramic-md all-fields-error"
          >
            <div class="flex items-center gap-ceramic-xs">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="text-red-600 !text-ceramic-lg"
              />
              <p class="text-red-800 font-medium">{{ submitError }}</p>
            </div>
          </div>

          <!-- Success Message -->
          <div
            v-if="submitted"
            class="bg-sage-50 border border-sage-200 rounded-ceramic-md p-ceramic-md"
          >
            <div class="flex items-center gap-ceramic-xs">
              <UIcon name="i-heroicons-check-circle" class="text-sage-600 !text-ceramic-lg" />
              <p class="text-sage-800 font-medium">
                Thank you for your message! I'll get back to you soon.
              </p>
            </div>
          </div>

          <!-- Contact Form -->
          <UForm v-if="!submitted" :schema="schema" :state="form" @submit="handleSubmit">
            <!-- First Name Field -->
            <UFormField name="firstName" label="First Name" required>
              <UInput
                v-model="form.firstName"
                name="firstName"
                placeholder="First Name"
                size="lg"
                color="neutral"
                variant="outline"
                class="w-full"
              />
            </UFormField>

            <!-- Last Name Field -->
            <UFormField name="lastName" label="Last Name" required>
              <UInput
                v-model="form.lastName"
                name="lastName"
                placeholder="Last Name"
                size="lg"
                color="neutral"
                variant="outline"
                class="w-full"
              />
            </UFormField>

            <!-- Email Field -->
            <UFormField name="email" label="Email" required>
              <UInput
                v-model="form.email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                size="lg"
                color="neutral"
                variant="outline"
                class="w-full"
              />
            </UFormField>

            <!-- Message Field -->
            <UFormField name="message" label="Message" required>
              <UTextarea
                v-model="form.message"
                name="message"
                placeholder="Tell me about your project, ideas, or any questions you have..."
                :rows="6"
                size="lg"
                color="neutral"
                class="w-full"
                autoresize
              />
            </UFormField>

            <!-- hCaptcha Widget -->
            <div class="mb-ceramic-md">
              <div id="h-captcha-container" class="min-h-[78px]" />
            </div>

            <!-- Submit Button -->
            <div class="pt-ceramic-sm">
              <UButton
                type="submit"
                size="lg"
                color="neutral"
                :loading="loading"
                :disabled="loading"
                class="w-full md:w-[20rem] px-ceramic-lg py-ceramic-sm bg-clay-700 hover:bg-stone-700 text-cream-25 rounded-none"
              >
                <template v-if="loading">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin !text-ceramic-base mr-2"
                  />
                  Sending...
                </template>
                <template v-else> Submit </template>
              </UButton>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>
