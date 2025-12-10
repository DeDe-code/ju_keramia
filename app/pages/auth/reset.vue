<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabase } from '~~/composables/useSupabase';
import { usePasswordLeakCheck } from '~~/composables/usePasswordLeakCheck';
import {
  adminPasswordResetSchema,
  type AdminPasswordResetSchema,
} from '~~/shared/adminPasswordResetSchema';

// Use admin layout instead of default
definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const supabase = useSupabase();
const { checkPasswordWithMessage, isChecking: checkingLeak } = usePasswordLeakCheck();

const form = ref<AdminPasswordResetSchema>({
  newPassword: '',
  confirmPassword: '',
});

const loading = ref(false);
const exchanging = ref(true); // exchanging/validating the reset token on mount
const canReset = ref(false); // becomes true after a successful token exchange

const errorMsg = ref('');
const successMsg = ref('');
const leakWarning = ref('');

// Use shared schema for validation (Zod)
const schema = adminPasswordResetSchema;

/**
 * Consume the recovery token from Supabase as soon as the page loads.
 * Supports: ?code=, ?token_hash=  OR  #access_token=&refresh_token=
 * Also surfaces Supabase hash errors like otp_expired.
 */
onMounted(async () => {
  if (!import.meta.client) return;

  try {
    // If Supabase already put an error in the hash, show it.
    const rawHash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    const hp = new URLSearchParams(rawHash);

    const hashError = hp.get('error'); // e.g. access_denied
    const error_code = hp.get('error_code'); // e.g. otp_expired
    const error_description = hp.get('error_description');

    if (hashError || error_code) {
      errorMsg.value = decodeURIComponent(error_description || 'Reset link invalid or expired.');
      canReset.value = false;
      return;
    }

    // Query params
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get('code');
    const token_hash = qs.get('token_hash');

    // Hash tokens (PKCE/callback shape)
    const access_token = hp.get('access_token');
    const refresh_token = hp.get('refresh_token');

    // Consume token in priority order
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      canReset.value = true;
    } else if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash,
      });
      if (error) throw error;
      canReset.value = true;
    } else if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error || !data?.session) {
        throw new Error(error?.message || 'Failed to establish session.');
      }
      canReset.value = true;
    } else {
      // No recognizable token found
      errorMsg.value = 'Invalid or expired reset link. Please reopen the password reset email.';
      canReset.value = false;
      return;
    }

    // Clean sensitive params from URL after successful exchange
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
  } catch (e) {
    errorMsg.value = (e as Error)?.message || 'Reset link invalid or expired.';
    canReset.value = false;
  } finally {
    exchanging.value = false;
  }
});

const updateUserPassword = async () => {
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  leakWarning.value = '';

  try {
    // Check if password has been leaked (client-side HIBP check)
    const leakCheck = await checkPasswordWithMessage(form.value.newPassword);

    if (leakCheck.isLeaked) {
      errorMsg.value =
        leakCheck.message || 'This password has been compromised. Please choose a different one.';
      loading.value = false;
      return;
    }

    // Ensure we still have a session (should be true after exchange)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      errorMsg.value = 'Invalid or expired reset link. Please reopen the password reset email.';
      return;
    }

    const { data, error: resetError } = await supabase.auth.updateUser({
      password: form.value.newPassword,
    });

    if (resetError) {
      errorMsg.value = resetError.message;
      return;
    }

    if (data) {
      successMsg.value = 'Password reset successfully! Redirecting to login...';

      // Sign out the user after password change
      await supabase.auth.signOut();

      // Redirect to admin login page after a brief delay with a query parameter
      setTimeout(() => {
        router.push('/admin?passwordReset=true');
      }, 1500);
    }
  } catch (error) {
    errorMsg.value = 'An unexpected error occurred. Please try again.';
    console.log((error as Error)?.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex justify-center min-h-screen py-ceramic-xl px-ceramic-md bg-cream-25">
    <div
      class="w-lg max-w-lg h-[23rem] flex flex-col justify-center mt-ceramic-xl p-ceramic-sm border border-stone-300 shadow-sm"
    >
      <!-- Message area (keeps your minimal UI) -->
      <div v-if="errorMsg" class="mb-ceramic-sm text-ceramic-error text-ceramic-sm">
        {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="mb-ceramic-sm text-sage-700">{{ successMsg }}</div>
      <div v-if="leakWarning" class="mb-ceramic-sm text-amber-600 text-ceramic-sm">
        {{ leakWarning }}
      </div>

      <!-- Optional: a lightweight exchanging state -->
      <div v-if="exchanging" class="opacity-70 mb-4">Preparing reset…</div>

      <!-- Form (unchanged UI components), disabled until token exchange succeeded -->
      <UForm :schema="schema" :state="form" @submit.prevent="updateUserPassword">
        <UFormField name="password">
          <UInput
            v-model="form.newPassword"
            type="password"
            placeholder="New Password"
            size="lg"
            color="neutral"
            variant="outline"
            class="w-full border-stone-300"
            :disabled="loading || !canReset || exchanging"
          />
        </UFormField>

        <UFormField name="password">
          <UInput
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm Password"
            size="lg"
            color="neutral"
            variant="outline"
            class="w-full mt-ceramic-sm border-stone-300"
            :disabled="loading || !canReset || exchanging"
          />
        </UFormField>

        <div class="pt-ceramic-sm">
          <UButton
            type="submit"
            size="lg"
            color="neutral"
            :loading="loading || checkingLeak"
            :disabled="loading || checkingLeak || !canReset || exchanging"
            class="w-full mt-ceramic-sm py-ceramic-sm bg-clay-700 hover:bg-stone-700 text-cream-25 rounded-none"
          >
            <template v-if="loading || checkingLeak">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin !text-ceramic-base mr-2" />
              {{ checkingLeak ? 'Checking password...' : 'Sending...' }}
            </template>
            <template v-else> Submit </template>
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>
