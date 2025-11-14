<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminLoginSchema } from '~~/shared/adminLoginSchema';
import { useAdminAuth } from '~~/composables/useAdminAuth';

const route = useRoute();
const router = useRouter();

// Use the admin authentication composable
const { user, error, resetMessage, form, signIn, signOut, handleForgotPassword } = useAdminAuth();

// Schema for form validation
const schema = adminLoginSchema;

// Message to display after password reset
const passwordResetSuccess = ref(false);

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
  <div class="flex justify-center min-h-screen py-ceramic-xl px-ceramic-md bg-cream-25">
    <div
      v-if="!user"
      class="w-lg max-w-lg h-[23rem] flex flex-col justify-center mt-ceramic-xl p-ceramic-sm border border-stone-300 shadow-sm"
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
      <div class="flex justify-between items-center mb-ceramic-lg">
        <h2 class="font-ceramic-display text-ceramic-2xl text-clay-800">Admin Dashboard</h2>
        <button
          class="bg-stone-200 text-clay-700 px-ceramic-sm py-ceramic-xs rounded-ceramic-md hover:!text-clay-800 transition-all duration-200"
          @click="signOut"
        >
          Logout
        </button>
      </div>

      <!-- Dashboard Content with Tabs -->
      <AdminDashboardContent />
    </div>
  </div>
</template>
