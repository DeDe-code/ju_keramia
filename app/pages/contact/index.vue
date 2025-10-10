<script setup lang="ts">
import { z } from 'zod';

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

// Load hCaptcha script
useHead({
  script: [
    {
      src: 'https://js.hcaptcha.com/1/api.js',
      async: true,
      defer: true,
      onload: 'console.log("hCaptcha script loaded successfully")',
      onerror: 'console.error("hCaptcha script failed to load")',
    },
  ],
});

// Runtime config for hCaptcha
const config = useRuntimeConfig();

// Debug log for development
if (import.meta.dev) {
  console.log('hCaptcha Site Key:', config.public.hcaptchaSiteKey);
}

// Check if hCaptcha script is loaded
onMounted(() => {
  if (import.meta.client) {
    console.log('Page mounted, checking hCaptcha...');
    console.log('window.hcaptcha exists:', !!window.hcaptcha);
    console.log('hCaptcha site key:', config.public.hcaptchaSiteKey);

    // Wait a bit for script to load
    setTimeout(() => {
      console.log('After timeout - window.hcaptcha exists:', !!window.hcaptcha);
      if (!window.hcaptcha) {
        console.error('hCaptcha script failed to load via useHead, trying manual injection...');

        // Fallback: manually inject script
        const script = document.createElement('script');
        script.src = 'https://js.hcaptcha.com/1/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('hCaptcha script loaded manually');
          // Try to render after manual load
          setTimeout(() => {
            const hcaptchaElement = document.querySelector('.h-captcha');
            if (hcaptchaElement && window.hcaptcha) {
              try {
                window.hcaptcha.render(hcaptchaElement as HTMLElement, {
                  sitekey: config.public.hcaptchaSiteKey,
                  callback: 'onHCaptchaVerify',
                  'expired-callback': 'onHCaptchaExpire',
                  theme: 'light',
                });
                console.log('Manual render after script injection successful');
              } catch (error) {
                console.error('Manual render after script injection failed:', error);
              }
            }
          }, 500);
        };
        script.onerror = () => console.error('Manual script injection failed');
        document.head.appendChild(script);
      } else {
        // Try manual render if needed
        const hcaptchaElement = document.querySelector('.h-captcha');
        if (hcaptchaElement && !hcaptchaElement.hasChildNodes()) {
          console.log('Attempting manual hCaptcha render...');
          try {
            window.hcaptcha.render(hcaptchaElement as HTMLElement, {
              sitekey: config.public.hcaptchaSiteKey,
              callback: 'onHCaptchaVerify',
              'expired-callback': 'onHCaptchaExpire',
              theme: 'light',
            });
            console.log('Manual render successful');
          } catch (error) {
            console.error('Manual render failed:', error);
          }
        }
      }
    }, 2000);
  }
});

// hCaptcha type declarations
declare global {
  interface Window {
    hcaptcha?: {
      reset(widgetId?: string): void;
      render(element: HTMLElement, options: Record<string, unknown>): string;
    };
    onHCaptchaVerify?: (token: string) => void;
    onHCaptchaExpire?: () => void;
  }
}

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
const hcaptchaToken = ref('');
const hcaptchaKey = ref(0); // Key to force re-render of hCaptcha

// Form validation schema using Zod for Nuxt UI
const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// hCaptcha callback functions (accessed globally)
if (import.meta.client) {
  window.onHCaptchaVerify = (token: string) => {
    hcaptchaToken.value = token;
  };

  window.onHCaptchaExpire = () => {
    hcaptchaToken.value = '';
  };
}

// Helper function to reset hCaptcha automatically
const resetHCaptcha = () => {
  if (import.meta.client) {
    try {
      // Simple automated reset using Vue reactivity
      hcaptchaToken.value = '';
      hcaptchaKey.value += 1; // Force re-render of hCaptcha component
      console.log('hCaptcha reset automatically with key:', hcaptchaKey.value);
      return true;
    } catch (error) {
      console.warn('Failed to reset hCaptcha:', error);
      return false;
    }
  }
  return false;
};

// Submit handler
const handleSubmit = async () => {
  // Reset error state
  submitError.value = '';

  // Check for hCaptcha token
  if (!hcaptchaToken.value) {
    submitError.value = 'Please complete the captcha verification';
    return;
  }

  loading.value = true;

  try {
    console.log('Submitting form to /api/contact with data:', {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      message: form.value.message,
      hcaptchaToken: hcaptchaToken.value ? 'TOKEN_PROVIDED' : 'NO_TOKEN',
    });

    const response = await $fetch('/api/contact', {
      method: 'POST',
      body: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        message: form.value.message,
        hcaptchaToken: hcaptchaToken.value,
      },
    });

    console.log('Form submitted successfully:', response);
    submitted.value = true;

    // Reset hCaptcha immediately after successful submission
    resetHCaptcha();

    // Reset form after successful submission
    setTimeout(() => {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      };
      hcaptchaToken.value = '';
      submitted.value = false;

      // Reset hCaptcha widget again if available
      resetHCaptcha();
    }, 5000);
  } catch (error: unknown) {
    console.error('Error submitting form:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Reset hCaptcha on error so user can try again
    resetHCaptcha();

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

    // Reset hCaptcha on error
    hcaptchaToken.value = '';
    if (import.meta.client && window.hcaptcha) {
      window.hcaptcha.reset();
    }
  } finally {
    loading.value = false;
  }
};

// Load hCaptcha script
useHead({
  script: [
    {
      src: 'https://js.hcaptcha.com/1/api.js',
      async: true,
      defer: true,
    },
  ],
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
              <div
                :key="hcaptchaKey"
                class="h-captcha"
                :data-sitekey="config.public.hcaptchaSiteKey"
                data-callback="onHCaptchaVerify"
                data-expired-callback="onHCaptchaExpire"
                data-theme="light"
              />
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
