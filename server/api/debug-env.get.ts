export default defineEventHandler(async (_event) => {
  // Only allow this in development or for debugging
  const config = useRuntimeConfig();

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    publicKeys: {
      hcaptchaSiteKey: config.public.hcaptchaSiteKey ? 'SET' : 'MISSING',
      hcaptchaSiteKeyValue: config.public.hcaptchaSiteKey
        ? config.public.hcaptchaSiteKey.substring(0, 8) + '...'
        : 'NOT_FOUND',
    },
    privateKeys: {
      hcaptchaSecretKey: config.hcaptchaSecretKey ? 'SET' : 'MISSING',
      resendApiKey: config.resendApiKey ? 'SET' : 'MISSING',
    },
  };
});
