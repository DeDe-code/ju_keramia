<script setup lang="ts">
import { z } from 'zod';
import useCaptcha from '../../../composables/useCaptcha';

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

// Use clean hCaptcha composable
const hcaptcha = useCaptcha();

// Form state management
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  message: '',
});

const loading = ref(false);
const submitted = ref(false);
const submitError = ref('');

// Form validation schema using Zod for Nuxt UI
const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Initialize hCaptcha widget when component mounts
onMounted(async () => {
  if (import.meta.client && hcaptcha.siteKey) {
    try {
      await hcaptcha.render('h-captcha-container', {
        sitekey: hcaptcha.siteKey,
        theme: 'light',
        size: 'normal',
      });
    } catch (error) {
      console.error('Failed to render hCaptcha:', error);
    }
  }
});

// Submit handler with proper validation
const handleSubmit = async () => {
  // Reset error state
  submitError.value = '';

  // 1. FIRST: Validate form data using Zod schema
  try {
    schema.parse(form.value);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      // Extract first validation error message
      const firstError = validationError.errors[0];
      submitError.value = firstError?.message ?? 'Validation error';
      return;
    }
    submitError.value = 'Please check your form data';
    return;
  }

  // 2. SECOND: Check for hCaptcha token
  if (!hcaptcha.token.value) {
    submitError.value = 'Please complete the captcha verification';
    return;
  }

  loading.value = true;

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        message: form.value.message,
        hcaptchaToken: hcaptcha.token.value,
      },
    });

    submitted.value = true;

    // Reset hCaptcha after successful submission
    hcaptcha.reset();

    // Reset form after 5 seconds
    setTimeout(() => {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      };
      submitted.value = false;
      hcaptcha.reset();
    }, 5000);
  } catch (error: unknown) {
    // Reset hCaptcha on error so user can try again
    hcaptcha.reset();

    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = error.data as { statusMessage?: string };
      if (errorData?.statusMessage) {
        submitError.value = errorData.statusMessage;
      } else {
        submitError.value = 'Something went wrong. Please try again later.';
      }
    } else if (error instanceof Error) {
      submitError.value = error.message;
    } else {
      submitError.value = 'Something went wrong. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
};
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
            v-if="submitError"
            class="bg-red-50 border border-red-200 rounded-ceramic-md p-ceramic-md mb-ceramic-md"
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
            <!-- Name Fields -->
            <div class="flex flex-col w-full md:gap-ceramic-md mb-ceramic-md">
              <!-- First Name -->
              <div class="space-y-ceramic-xs">
                <label class="block text-stone-700 font-medium text-ceramic-sm">
                  First Name <span class="text-clay-600">*</span>
                </label>
                <UInput
                  v-model="form.firstName"
                  name="firstName"
                  placeholder="First Name"
                  size="lg"
                  color="neutral"
                  variant="outline"
                  class="w-full bg-cream-50"
                />
              </div>

              <!-- Last Name -->
              <div class="space-y-ceramic-xs">
                <label class="block text-stone-700 font-medium text-ceramic-sm">
                  Last Name <span class="text-clay-600">*</span>
                </label>
                <UInput
                  v-model="form.lastName"
                  name="lastName"
                  placeholder="Last Name"
                  size="lg"
                  color="neutral"
                  variant="outline"
                  class="w-full bg-cream-50"
                />
              </div>
            </div>

            <!-- Email Field -->
            <div class="w-full space-y-ceramic-xs mb-ceramic-md">
              <label class="block text-stone-700 font-medium text-ceramic-sm">
                Email <span class="text-clay-600">*</span>
              </label>
              <UInput
                v-model="form.email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                size="lg"
                color="neutral"
                variant="outline"
                class="w-full bg-cream-50"
              />
            </div>

            <!-- Message Field -->
            <div class="w-full space-y-ceramic-xs mb-ceramic-md">
              <label class="block text-stone-700 font-medium text-ceramic-sm">
                Message <span class="text-clay-600">*</span>
              </label>
              <UTextarea
                v-model="form.message"
                name="message"
                placeholder="Tell me about your project, ideas, or any questions you have..."
                :rows="6"
                size="lg"
                color="neutral"
                class="w-full bg-cream-50"
                autoresize
              />
            </div>

            <!-- hCaptcha Widget -->
            <div class="mb-ceramic-md">
              <div id="h-captcha-container" style="min-height: 78px" />
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
