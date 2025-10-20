import { ref, readonly, onMounted } from 'vue';
import { useHead, useRuntimeConfig } from '#app';

/**
 * Clean, lightweight hCaptcha composable for Nuxt 3
 * Based on official hCaptcha JavaScript API documentation
 *
 * Features:
 * - Simple, secure integration
 * - TypeScript support
 * - Proper SSR handling
 * - Minimal complexity
 */

interface HCaptchaConfig {
  sitekey: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  tabindex?: number;
}

interface HCaptchaCallbacks {
  onVerify?: (token: string) => void;
  onExpired?: () => void;
  onError?: (error: string) => void;
}

// Global types for hCaptcha API
declare global {
  interface Window {
    hcaptcha?: {
      render(container: string | HTMLElement, params: Record<string, unknown>): string;
      reset(widgetId?: string): void;
      getResponse(widgetId?: string): string;
      execute(widgetId?: string): void;
    };
    hcaptchaReady?: () => void;
  }
}

export default function useCaptcha() {
  const config = useRuntimeConfig();
  const token = ref<string>('');
  const widgetId = ref<string | null>(null);
  const isLoaded = ref(false);
  const error = ref<string>('');

  // Load hCaptcha script with explicit rendering
  const loadScript = () => {
    if (import.meta.server || isLoaded.value) return;

    useHead({
      script: [
        {
          src: 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaReady',
          async: true,
          defer: true,
        },
      ],
    });

    // Global callback for when hCaptcha is ready
    if (import.meta.client) {
      window.hcaptchaReady = () => {
        isLoaded.value = true;
      };
    }
  };

  // Render hCaptcha widget
  const render = (
    containerId: string,
    hcaptchaConfig: HCaptchaConfig,
    callbacks: HCaptchaCallbacks = {}
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (import.meta.server) {
        reject(new Error('hCaptcha can only be rendered on client-side'));
        return;
      }

      const attemptRender = () => {
        if (!window.hcaptcha || !isLoaded.value) {
          setTimeout(attemptRender, 100);
          return;
        }

        try {
          // Check if container exists and clear it first
          const container = document.getElementById(containerId);
          if (!container) {
            reject(new Error(`Container with id "${containerId}" not found`));
            return;
          }

          // Clear the container before rendering new widget
          container.innerHTML = '';

          const id = window.hcaptcha.render(containerId, {
            sitekey: hcaptchaConfig.sitekey,
            theme: hcaptchaConfig.theme || 'light',
            size: hcaptchaConfig.size || 'normal',
            tabindex: hcaptchaConfig.tabindex,
            callback: (responseToken: string) => {
              token.value = responseToken;
              callbacks.onVerify?.(responseToken);
            },
            'expired-callback': () => {
              token.value = '';
              callbacks.onExpired?.();
            },
            'error-callback': (err: string) => {
              error.value = err;
              callbacks.onError?.(err);
            },
          });

          widgetId.value = id;
          resolve(id);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to render hCaptcha';
          error.value = errorMessage;
          reject(new Error(errorMessage));
        }
      };

      attemptRender();
    });
  };

  // Reset hCaptcha widget
  const reset = () => {
    if (import.meta.server || !window.hcaptcha) return;

    token.value = '';
    error.value = '';
    window.hcaptcha.reset(widgetId.value || undefined);
  };

  // Get current response token
  const getResponse = (): string => {
    if (import.meta.server || !window.hcaptcha) return '';
    return window.hcaptcha.getResponse(widgetId.value || undefined) || '';
  };

  // Execute hCaptcha (for invisible mode)
  const execute = () => {
    if (import.meta.server || !window.hcaptcha) return;
    window.hcaptcha.execute(widgetId.value || undefined);
  };

  // Initialize on client-side
  onMounted(() => {
    if (import.meta.client) {
      loadScript();
    }
  });

  return {
    // State
    token: readonly(token),
    widgetId: readonly(widgetId),
    isLoaded: readonly(isLoaded),
    error: readonly(error),

    // Methods
    render,
    reset,
    getResponse,
    execute,

    // Config
    siteKey: config.public.hcaptchaSiteKey,
  };
}
