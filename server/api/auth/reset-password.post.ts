/**
 * Password Reset API Endpoint
 *
 * Sends a password reset email to the user via Supabase.
 *
 * Security:
 * - Rate limiting should be implemented (TODO)
 * - Email validation
 * - Redirect URL validation
 */

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event);
    const { email } = body;

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required',
      });
    }

    // Get site URL from runtime config
    const config = useRuntimeConfig();
    const siteUrl = config.public.siteUrl;

    if (!siteUrl) {
      throw createError({
        statusCode: 500,
        message: 'Site URL is not configured',
      });
    }

    // Send password reset email
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset`,
    });

    if (error) {
      throw createError({
        statusCode: 400,
        message: error.message,
      });
    }

    return {
      success: true,
      message: 'Password reset email sent',
    };
  } catch (error) {
    console.error('Password reset error:', error);

    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to send reset email',
    });
  }
});
