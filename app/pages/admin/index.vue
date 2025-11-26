<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminLoginSchema } from '~~/shared/adminLoginSchema';
import { useAuthStore } from '~~/stores/auth';

// Use admin layout instead of default
definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();

// Use the Pinia auth store
const authStore = useAuthStore();

// Schema for form validation
const schema = adminLoginSchema;

// Local form state
const form = ref({
  email: '',
  password: '',
});

// Local error and message state
const error = ref('');
const resetMessage = ref('');

// Message to display after password reset
const passwordResetSuccess = ref(false);

// Computed property for user
const user = computed(() => authStore.user);

/**
 * Handle sign in
 */
const signIn = async () => {
  error.value = '';
  const result = await authStore.signIn({
    email: form.value.email,
    password: form.value.password,
  });

  if (result.success) {
    // Clear form on success
    form.value = { email: '', password: '' };
  } else {
    error.value = result.error || 'Login failed';
  }
};

/**
 * Handle sign out
 */
const signOut = async () => {
  await authStore.signOut();
};

/**
 * Handle forgot password
 */
const handleForgotPassword = async () => {
  resetMessage.value = '';

  if (!form.value.email) {
    resetMessage.value = 'Please enter your email above first.';
    setTimeout(() => {
      resetMessage.value = '';
    }, 5000);
    return;
  }

  const result = await authStore.resetPassword(form.value.email);

  if (result.success) {
    resetMessage.value = 'Password reset email sent. Please check your inbox.';
  } else {
    resetMessage.value = result.error || 'Failed to send reset email';
  }

  setTimeout(() => {
    resetMessage.value = '';
  }, 5000);
};

onMounted(() => {
  // Check if user was redirected after password reset
  if (route.query.passwordReset === 'true') {
    passwordResetSuccess.value = true;
    // Clean up the URL by removing the query parameter
    router.replace('/admin');

    // Clear the message after 5 seconds
    setTimeout(() => {
      passwordResetSuccess.value = false;
    }, 5000);
  }
});
</script>

<template>
  <div class="min-h-screen bg-cream-25">
    <div
      v-if="!user"
      class="w-lg max-w-lg h-[23rem] mx-auto flex flex-col justify-center mt-ceramic-xl p-ceramic-sm border border-stone-300 shadow-sm"
    >
      <!-- Password reset success message -->
      <div
        v-if="passwordResetSuccess"
        class="mb-ceramic-sm px-ceramic-sm py-ceramic-xs text-clay-800"
      >
        Log In with the new password
      </div>

      <UForm :schema="schema" :state="form" @submit.prevent="signIn">
        <UFormField name="email">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="Email"
            size="lg"
            color="neutral"
            variant="outline"
            class="w-full px-ceramic-sm py-ceramic-xs border-stone-300"
          />
        </UFormField>

        <UFormField name="password">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="Password"
            size="lg"
            color="neutral"
            variant="outline"
            class="w-full mt-ceramic-sm px-ceramic-sm py-ceramic-xs border-stone-300"
          />
        </UFormField>
        <div class="flex items-center justify-center mx-ceramic-sm">
          <UButton
            type="submit"
            size="lg"
            color="neutral"
            class="w-full mt-ceramic-sm py-ceramic-sm bg-clay-700 hover:bg-stone-700 text-cream-25 rounded-none"
          >
            Login
          </UButton>
        </div>

        <div v-if="error" class="text-clay-700 mt-ceramic-sm">{{ error }}</div>
      </UForm>
      <UButton
        class="self-start mt-ceramic-sm ml-ceramic-sm text-clay-700 hover:!text-clay-800 hover:underline transition-all duration-200"
        @click="handleForgotPassword"
      >
        Forgot Password?
      </UButton>
      <div
        v-if="resetMessage"
        class="mt-ceramic-sm ml-ceramic-sm text-ceramic-sm text-ceramic-error"
      >
        {{ resetMessage }}
      </div>
    </div>
    <div v-else>
      <div
        class="flex justify-between items-center mb-ceramic-lg px-ceramic-lg sm:px-ceramic-xl lg:px-ceramic-3xl py-ceramic-lg border-2"
      >
        <h2 class="font-ceramic-display text-ceramic-2xl text-clay-800">Admin Dashboard</h2>
        <UButton class="text-ceramic-error border-2 border-ceramic-error" @click="signOut">
          Logout
        </UButton>
      </div>

      <!-- Dashboard Content with Tabs -->
      <AdminDashboardContent />
    </div>
  </div>
</template>
