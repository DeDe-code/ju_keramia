import { ref, readonly, nextTick } from 'vue';
import useCaptcha from './useCaptcha';
import { contactFormSchema, type ContactFormSchema } from '~~/shared/contactFormSchema';
/**
 * Contact Form Validation Composable
 *
 * Handles all contact form validation logic, state management,
 * and submission for the Ju Keramia contact page.
 *
 * Features:
 * - hCaptcha integration and validation
 * - Form submission with proper error handling
 * - Loading states and success management
 * - Automatic form reset after successful submission
 */

export const useContactFormValidation = () => {
  // hCaptcha integration
  const hcaptcha = useCaptcha();

  // Form state management
  const form = ref<ContactFormSchema>({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const loading = ref(false);
  const submitted = ref(false);
  const submitError = ref('');

  // Use shared schema for validation
  const schema = contactFormSchema;

  // Validate hCaptcha token
  const validateCaptcha = (): { isValid: boolean; error?: string } => {
    if (!hcaptcha.token.value) {
      return {
        isValid: false,
        error: 'Please complete the captcha verification',
      };
    }
    return { isValid: true };
  };

  // Reset form to initial state
  const resetForm = async () => {
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    };
    submitted.value = false;
    submitError.value = '';
    hcaptcha.reset();

    // Re-initialize captcha after form becomes visible again
    await nextTick();
    await initializeCaptcha();
  };

  // Handle successful form submission
  const handleSubmissionSuccess = () => {
    submitted.value = true;
    hcaptcha.reset();

    // Auto-reset form after 5 seconds
    setTimeout(() => {
      resetForm();
    }, 5000);
  };

  // Handle form submission errors
  const handleSubmissionError = (error: unknown) => {
    // Reset hCaptcha on error so user can try again
    hcaptcha.reset();

    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = error.data as { statusMessage?: string };
      if (errorData?.statusMessage) {
        submitError.value = errorData.statusMessage;
        console.log('[ContactForm] submitError set:', submitError.value);
      } else {
        submitError.value = 'Something went wrong. Please try again later.';
        console.log('[ContactForm] submitError set:', submitError.value);
      }
    } else if (error instanceof Error) {
      submitError.value = error.message;
      console.log('[ContactForm] submitError set:', submitError.value);
    } else {
      submitError.value = 'Something went wrong. Please try again later.';
      console.log('[ContactForm] submitError set:', submitError.value);
    }
  };

  // Main form submission handler
  const handleSubmit = async () => {
    // Reset error state
    submitError.value = '';

    // Check for hCaptcha token
    const captchaValidation = validateCaptcha();
    if (!captchaValidation.isValid) {
      submitError.value = captchaValidation.error!;
      console.log('[ContactForm] submitError set:', submitError.value);
      return;
    }

    loading.value = true;

    try {
      // Use Nuxt's $fetch for API calls
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

      handleSubmissionSuccess();
    } catch (error: unknown) {
      handleSubmissionError(error);
    } finally {
      loading.value = false;
    }
  };

  // Initialize hCaptcha widget
  const initializeCaptcha = async () => {
    // Check if we're on client side and hCaptcha site key is available
    if (import.meta.client && hcaptcha.siteKey) {
      try {
        // Wait a bit to ensure the DOM element is available
        await new Promise((resolve) => setTimeout(resolve, 100));

        await hcaptcha.render('h-captcha-container', {
          sitekey: hcaptcha.siteKey,
          theme: 'light',
          size: 'normal',
        });
      } catch (error) {
        console.error('Failed to render hCaptcha:', error);
        // Set an error message that can be displayed to the user
        submitError.value = 'Failed to load captcha. Please refresh the page and try again.';
      }
    }
  };

  return {
    // Form state (form needs to be mutable for v-model binding)
    form,
    loading: readonly(loading),
    submitted: readonly(submitted),
    submitError: readonly(submitError),

    // Validation schema for Nuxt UI
    schema,

    // hCaptcha integration
    hcaptcha,

    // Form methods
    handleSubmit,
    resetForm,
    // validateForm removed
    validateCaptcha,
    initializeCaptcha,

    // Individual handlers for custom use cases
    handleSubmissionSuccess,
    handleSubmissionError,
  };
};

export default useContactFormValidation;
