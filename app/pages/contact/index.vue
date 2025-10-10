<script setup lang="ts">
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

// Runtime config for hCaptcha
const config = useRuntimeConfig();

// Debug log for development
if (import.meta.dev) {
  console.log('hCaptcha Site Key:', config.public.hcaptchaSiteKey);
}

// hCaptcha type declarations
declare global {
  interface Window {
    hcaptcha?: {
      reset(): void;
      render(element: HTMLElement, options: Record<string, unknown>): void;
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

// Form validation schema
const schema = {
  firstName: (value: string) => value?.length >= 2 || 'First name must be at least 2 characters',
  lastName: (value: string) => value?.length >= 2 || 'Last name must be at least 2 characters',
  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Please enter a valid email address';
  },
  message: (value: string) => value?.length >= 10 || 'Message must be at least 10 characters',
};

// hCaptcha callback functions (accessed globally)
if (import.meta.client) {
  window.onHCaptchaVerify = (token: string) => {
    hcaptchaToken.value = token;
  };

  window.onHCaptchaExpire = () => {
    hcaptchaToken.value = '';
  };
}

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

      // Reset hCaptcha widget if available
      if (import.meta.client && window.hcaptcha) {
        window.hcaptcha.reset();
      }
    }, 5000);
  } catch (error: unknown) {
    console.error('Error submitting form:', error);

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
