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

// Form state management
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  message: '',
  newsletter: false,
});

const loading = ref(false);
const submitted = ref(false);

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

// Submit handler
const handleSubmit = async () => {
  loading.value = true;
  
  try {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', form.value);
    
    submitted.value = true;
    
    // Reset form after successful submission
    setTimeout(() => {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        message: '',
        newsletter: false,
      };
      submitted.value = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-cream-25 py-ceramic-xl px-ceramic-md">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-ceramic-xl items-center">
        <!-- Image Section -->
        <div class="order-first lg:order-first">
          <div class="relative">
            <NuxtImg
              src="/image/contact-image.jpg"
              alt="Handcrafted ceramic bowls showcasing the artisanal craftsmanship of Ju Keramia"
              format="webp"
              quality="85"
              loading="lazy"
              width="600"
              height="600"
              class="w-full h-auto rounded-ceramic-lg shadow-lg object-cover"
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 70vw, (max-width: 1024px) 50vw, 600px"
            />
          </div>
        </div>

        <!-- Form Section -->
        <div class="space-y-ceramic-lg">
          <!-- Heading -->
          <div class="space-y-ceramic-sm">
            <h1 class="font-ceramic-display text-ceramic-4xl text-clay-950 mb-ceramic-md">
              contact.
            </h1>
            
            <p class="text-stone-600 leading-relaxed text-responsive-base">
              Interested in a collaboration? Fancy some tableware for your café or restaurant, or even
              a bespoke dinner set for your home? Fill in the form below and let's get designing and
              making together.
            </p>
          </div>

          <!-- Success Message -->
          <div v-if="submitted" class="bg-sage-50 border border-sage-200 rounded-ceramic-md p-ceramic-md">
            <div class="flex items-center gap-ceramic-xs">
              <UIcon name="i-heroicons-check-circle" class="text-sage-600 !text-ceramic-lg" />
              <p class="text-sage-800 font-medium">
                Thank you for your message! I'll get back to you soon.
              </p>
            </div>
          </div>

          <!-- Contact Form -->
          <UForm
            v-if="!submitted"
            :schema="schema"
            :state="form"
            class="space-y-ceramic-md"
            @submit="handleSubmit"
          >
            <!-- Name Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-ceramic-sm">
              <!-- First Name -->
              <div class="space-y-ceramic-xs">
                <label class="block text-stone-700 font-medium text-ceramic-sm">
                  First Name <span class="text-clay-600">*</span>
                </label>
                <UInput
                  v-model="form.firstName"
                  name="firstName"
                  placeholder="First Name"
                  size="md"
                  color="neutral"
                  variant="outline"
                  class="bg-cream-50"
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
                  size="md"
                  color="neutral"
                  variant="outline"
                  class="bg-cream-50"
                />
              </div>
            </div>

            <!-- Email Field -->
            <div class="space-y-ceramic-xs">
              <label class="block text-stone-700 font-medium text-ceramic-sm">
                Email <span class="text-clay-600">*</span>
              </label>
              <UInput
                v-model="form.email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                size="md"
                color="neutral"
                variant="outline"
                class="bg-cream-50"
              />
            </div>

            <!-- Newsletter Checkbox -->
            <div class="space-y-ceramic-xs">
              <UCheckbox
                v-model="form.newsletter"
                name="newsletter"
                label="Sign up for news and updates"
                color="neutral"
                class="text-stone-600"
              />
            </div>

            <!-- Message Field -->
            <div class="space-y-ceramic-xs">
              <label class="block text-stone-700 font-medium text-ceramic-sm">
                Message <span class="text-clay-600">*</span>
              </label>
              <UTextarea
                v-model="form.message"
                name="message"
                placeholder="Tell me about your project, ideas, or any questions you have..."
                :rows="6"
                size="md"
                color="neutral"
                variant="outline"
                class="bg-cream-50"
                autoresize
              />
            </div>

            <!-- Submit Button -->
            <div class="pt-ceramic-sm">
              <UButton
                type="submit"
                size="lg"
                color="neutral"
                variant="solid"
                :loading="loading"
                :disabled="loading"
                class="w-full md:w-auto px-ceramic-lg py-ceramic-sm bg-clay-700 hover:bg-clay-800 text-cream-25"
              >
                <template v-if="loading">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin !text-ceramic-base mr-2" />
                  Sending...
                </template>
                <template v-else>
                  Submit
                </template>
              </UButton>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles for form elements to match ceramic design */
:deep(.bg-cream-50) {
  background-color: var(--color-cream-50);
  border-color: var(--color-stone-300);
}

:deep(.bg-cream-50:focus) {
  border-color: var(--color-clay-600);
  box-shadow: 0 0 0 1px var(--color-clay-600);
}
</style>
