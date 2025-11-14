import { ref, onMounted } from 'vue';
import type { User } from '@supabase/supabase-js';
import { useSupabase } from './useSupabase';
import type { AdminLoginSchema } from '../shared/adminLoginSchema';

/**
 * Composable for handling admin authentication
 * Manages sign in, sign out, password reset, and user session
 */
export const useAdminAuth = () => {
  const supabase = useSupabase();

  const user = ref<User | null>(null);
  const error = ref('');
  const resetMessage = ref('');
  const form = ref<AdminLoginSchema>({
    email: '',
    password: '',
  });

  /**
   * Check if user is already authenticated on mount
   */
  const initializeAuth = async () => {
    const { data } = await supabase.auth.getUser();
    user.value = data.user;
  };

  /**
   * Sign in user with email and password
   */
  const signIn = async () => {
    error.value = '';
    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password,
    });

    if (signInError) {
      error.value = signInError.message;
    } else {
      user.value = data.user;
      form.value = { email: '', password: '' }; // Clear form
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    user.value = null;
  };

  /**
   * Handle forgot password functionality
   * Sends a password reset email to the user
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

    const siteUrl = useRuntimeConfig().public.siteUrl;
    if (!siteUrl) {
      resetMessage.value = 'Site URL is not configured.';
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.value.email, {
      redirectTo: `${siteUrl}/auth/reset`,
    });

    if (resetError) {
      resetMessage.value = resetError.message;
    } else {
      resetMessage.value = 'Password reset email sent. Please check your inbox.';
      setTimeout(() => {
        resetMessage.value = '';
      }, 5000);
    }
  };

  /**
   * Clear all error and message states
   */
  const clearMessages = () => {
    error.value = '';
    resetMessage.value = '';
  };

  // Initialize auth on composable creation
  onMounted(async () => {
    await initializeAuth();
  });

  return {
    // State
    user,
    error,
    resetMessage,
    form,

    // Methods
    signIn,
    signOut,
    handleForgotPassword,
    clearMessages,
    initializeAuth,
  };
};
