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
    },
  ],
});

// Runtime config for hCaptcha
const config = useRuntimeConfig();

// Robust hCaptcha initialization
onMounted(() => {
  if (import.meta.client) {
    // Start checking for hCaptcha availability immediately
    const initializeHCaptcha = () => {
      if (window.hcaptcha && config.public.hcaptchaSiteKey) {
        // hCaptcha is loaded and we have the site key
        renderHCaptcha();
      } else {
        // Keep checking every 100ms until available
        setTimeout(initializeHCaptcha, 100);
      }
    };

    // Start the initialization process
    initializeHCaptcha();
  }
});

// Function to manually render hCaptcha widget
const renderHCaptcha = (retryCount = 0) => {
  if (!import.meta.client) return;

  if (!window.hcaptcha) {
    if (retryCount < 20) {
      setTimeout(() => {
        renderHCaptcha(retryCount + 1);
      }, 200);
    }
    return;
  }

  if (!config.public.hcaptchaSiteKey) {
    return;
  }

  const hcaptchaElement = document.querySelector('.h-captcha') as HTMLElement;
  if (!hcaptchaElement) {
    if (retryCount < 20) {
      setTimeout(() => {
        renderHCaptcha(retryCount + 1);
      }, 200);
    }
    return;
  }

  // Check if widget is already rendered
  if (hcaptchaElement.hasChildNodes() && hcaptchaElement.children.length > 0) {
    return;
  }

  try {
    // Clear any existing content
    hcaptchaElement.innerHTML = '';

    // Render new widget
    const widgetId = window.hcaptcha.render(hcaptchaElement, {
      sitekey: config.public.hcaptchaSiteKey,
      callback: (token: string) => {
        hcaptchaToken.value = token;
      },
      'expired-callback': () => {
        hcaptchaToken.value = '';
      },
      'error-callback': (_error: string) => {
        // Silent error handling for hCaptcha errors
      },
      theme: 'light',
      size: 'normal',
    });

    hcaptchaWidgetId.value = widgetId;
  } catch {
    // Silent retry on hCaptcha render errors
    if (retryCount < 10) {
      setTimeout(() => {
        renderHCaptcha(retryCount + 1);
      }, 500);
    }
  }
}; // hCaptcha type declarations
declare global {
  interface Window {
    hcaptcha?: {
      reset(widgetId?: string): void;
      render(element: HTMLElement, options: Record<string, unknown>): string;
    };
    onHCaptchaVerify?: (token: string) => void;
    onHCaptchaExpire?: () => void;
    onHCaptchaLoaded?: () => void;
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
const hcaptchaWidgetId = ref<string | null>(null); // Track the widget ID

// Watch for hcaptchaKey changes to re-render widget
watch(hcaptchaKey, () => {
  if (import.meta.client) {
    nextTick(() => {
      setTimeout(() => {
        renderHCaptcha(0); // Start with retry count 0
      }, 100);
    });
  }
});

// Additional safety check - simpler DOM ready detection
if (import.meta.client) {
  // Just try to render when the element becomes available
  const observeHCaptchaElement = () => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector('.h-captcha');
      if (element && window.hcaptcha) {
        renderHCaptcha(0);
        observer.disconnect(); // Stop observing once we've found it
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up observer after 10 seconds
    setTimeout(() => {
      observer.disconnect();
    }, 10000);
  };

  onMounted(() => {
    setTimeout(observeHCaptchaElement, 50);
  });
}

// Form validation schema using Zod for Nuxt UI
const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// hCaptcha callback functions (no longer needed with manual rendering)

// Helper function to reset hCaptcha automatically
const resetHCaptcha = () => {
  if (import.meta.client) {
    try {
      // Clear the token first
      hcaptchaToken.value = '';

      // Reset the actual hCaptcha widget if the API is available
      if (window.hcaptcha && window.hcaptcha.reset && hcaptchaWidgetId.value) {
        window.hcaptcha.reset(hcaptchaWidgetId.value);
      }

      // Force complete re-render by incrementing the key
      // The watch will handle the actual re-rendering
      hcaptchaKey.value += 1;
      hcaptchaWidgetId.value = null;

      return true;
    } catch {
      // Silent reset handling
      return false;
    }
  }
  return false;
}; // Submit handler
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
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        message: form.value.message,
        hcaptchaToken: hcaptchaToken.value,
      },
    });

    submitted.value = true;

    // Reset hCaptcha after a short delay to ensure submission is processed
    setTimeout(() => {
      resetHCaptcha();
    }, 500);

    // Reset form after successful submission
    setTimeout(() => {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      };
      submitted.value = false;

      // Ensure hCaptcha is ready for next submission
      resetHCaptcha();
    }, 5000);
  } catch (error: unknown) {
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
              <ClientOnly>
                <div :key="hcaptchaKey" class="h-captcha" style="min-height: 78px" />
                <template #fallback>
                  <div
                    class="border border-gray-300 rounded bg-gray-50 flex items-center justify-center"
                    style="min-height: 78px"
                  >
                    <span class="text-gray-500 text-sm">Loading security check...</span>
                  </div>
                </template>
              </ClientOnly>
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
