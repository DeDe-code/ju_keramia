import { Resend } from 'resend';

// Type definitions
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

interface HCaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    });
  }

  // Get runtime config for environment variables
  const config = useRuntimeConfig();

  // Initialize Resend with API key from runtime config
  const resend = new Resend(config.resendApiKey);

  // hCaptcha verification function
  async function verifyHCaptcha(token: string, remoteIP?: string): Promise<boolean> {
    const secretKey = config.hcaptchaSecretKey;

    if (!secretKey) {
      throw new Error('hCaptcha secret key not configured');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (remoteIP) {
        formData.append('remoteip', remoteIP);
      }

      const response = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data: HCaptchaResponse = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('hCaptcha verification error:', error);
      return false;
    }
  }

  // Email template for contact form submissions
  function generateContactEmailHTML(formData: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission - Ju Keramia</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #4a432e;
              background-color: #fafafa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #fafafa;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: #4a432e;
              color: #fafafa;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: #ffffff;
              border-radius: 6px;
              border-left: 4px solid #4a432e;
            }
            .field-label {
              font-weight: 600;
              color: #4a432e;
              margin-bottom: 5px;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            .field-value {
              color: #586f6b;
              font-size: 16px;
            }
            .message-field {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 6px;
              border: 1px solid #e9ecef;
              white-space: pre-wrap;
              font-size: 15px;
              line-height: 1.6;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
            }
            .timestamp {
              font-size: 12px;
              color: #adb5bd;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Ju Keramia - Handcrafted Ceramics</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="field-label">First Name</div>
                <div class="field-value">${formData.firstName}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Last Name</div>
                <div class="field-value">${formData.lastName}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Email Address</div>
                <div class="field-value">${formData.email}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Message</div>
                <div class="message-field">${formData.message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>This message was sent via the contact form on jukeramia.com</p>
              <div class="timestamp">Received: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  try {
    // Parse the request body
    const body = await readBody(event);

    // Validate required fields
    const { firstName, lastName, email, message, hcaptchaToken } = body;

    if (!firstName || !lastName || !email || !message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields',
      });
    }

    if (!hcaptchaToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Captcha verification required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format',
      });
    }

    // Get client IP address for hCaptcha verification
    const clientIP =
      getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown';

    // Verify hCaptcha token
    const isValidCaptcha = await verifyHCaptcha(
      hcaptchaToken,
      typeof clientIP === 'string' ? clientIP : 'unknown'
    );

    if (!isValidCaptcha) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Captcha verification failed',
      });
    }

    // Prepare email data
    const emailData: ContactFormData = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
    };

    // Validate string lengths
    if (emailData.firstName.length < 2 || emailData.firstName.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'First name must be between 2 and 50 characters',
      });
    }

    if (emailData.lastName.length < 2 || emailData.lastName.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Last name must be between 2 and 50 characters',
      });
    }

    if (emailData.message.length < 10 || emailData.message.length > 2000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message must be between 10 and 2000 characters',
      });
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: config.resendFromEmail || 'contact@jukeramia.com',
      to: config.resendToEmail || 'hello@jukeramia.com',
      replyTo: emailData.email,
      subject: `New Contact Form Submission from ${emailData.firstName} ${emailData.lastName}`,
      html: generateContactEmailHTML(emailData),
    });

    // Log successful submission (for monitoring)
    console.log('Contact form submitted successfully:', {
      id: emailResult.data?.id,
      from: emailData.email,
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return {
      success: true,
      message: 'Your message has been sent successfully!',
      id: emailResult.data?.id,
    };
  } catch (error: unknown) {
    // Log error for debugging
    console.error('Contact form submission error:', error);

    // Return appropriate error response
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    // Handle Resend API errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ResendError') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Email service temporarily unavailable',
      });
    }

    // Generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
