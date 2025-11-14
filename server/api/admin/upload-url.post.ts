import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Server API endpoint to generate presigned URLs for uploading images to Cloudflare R2
 *
 * POST /api/admin/upload-url
 *
 * Request body:
 * {
 *   fileName: string,      // Original filename
 *   fileType: string,      // MIME type (e.g., 'image/jpeg')
 *   fileSize: number,      // File size in bytes
 *   imageType: 'hero' | 'product',  // Type of image
 *   subType?: 'landing' | 'about' | string  // Hero page or product slug
 * }
 *
 * Response:
 * {
 *   uploadUrl: string,     // Presigned URL for uploading
 *   publicUrl: string,     // Public URL after upload
 *   key: string,           // R2 object key (path)
 *   expiresIn: number      // URL expiration time (seconds)
 * }
 */

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. AUTHENTICATION CHECK
  // ============================================
  // TODO: Add authentication middleware to verify admin user
  // For now, we'll implement basic check
  // Later, integrate with your existing admin auth system

  // Example: Check if user is authenticated
  // const session = await getServerSession(event);
  // if (!session || !session.user) {
  //   throw createError({
  //     statusCode: 401,
  //     message: 'Unauthorized: Admin access required'
  //   });
  // }

  // ============================================
  // 2. READ REQUEST BODY
  // ============================================
  const body = await readBody(event);

  // Validate required fields
  if (!body.fileName || !body.fileType || !body.fileSize || !body.imageType) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: fileName, fileType, fileSize, imageType',
    });
  }

  const { fileName, fileType, fileSize, imageType, subType } = body;

  // ============================================
  // 3. VALIDATE FILE TYPE
  // ============================================
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedMimeTypes.includes(fileType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
    });
  }

  // ============================================
  // 4. VALIDATE FILE SIZE
  // ============================================
  const maxFileSize = 5 * 1024 * 1024; // 5MB (before compression)

  if (fileSize > maxFileSize) {
    throw createError({
      statusCode: 400,
      message: `File size exceeds maximum of ${maxFileSize / 1024 / 1024}MB`,
    });
  }

  // ============================================
  // 5. GENERATE UNIQUE FILE PATH
  // ============================================
  // Create unique filename with timestamp to prevent overwrites
  const timestamp = Date.now();
  const fileExtension = fileType.split('/')[1]; // 'jpeg', 'png', 'webp'

  let key: string; // R2 object key (path in bucket)

  if (imageType === 'hero') {
    // Hero images: hero/landing-{timestamp}.webp or hero/about-{timestamp}.webp
    if (!subType || !['landing', 'about'].includes(subType)) {
      throw createError({
        statusCode: 400,
        message: 'Hero images require subType: "landing" or "about"',
      });
    }
    key = `hero/${subType}-${timestamp}.${fileExtension}`;
  } else if (imageType === 'product') {
    // Product images: products/{product-slug}-{1|2|3}-{timestamp}.webp
    if (!subType) {
      throw createError({
        statusCode: 400,
        message: 'Product images require subType (product slug)',
      });
    }
    // subType should be like "ceramic-bowl-1", "ceramic-bowl-2", etc.
    key = `products/${subType}-${timestamp}.${fileExtension}`;
  } else {
    throw createError({
      statusCode: 400,
      message: 'Invalid imageType. Must be "hero" or "product"',
    });
  }

  // ============================================
  // 6. GET CLOUDFLARE R2 CREDENTIALS
  // ============================================
  const config = useRuntimeConfig();

  const accountId = config.cloudflareAccountId;
  const accessKeyId = config.cloudflareAccessKeyId;
  const secretAccessKey = config.cloudflareSecretAccessKey;
  const bucketName = config.cloudflareBucketName;
  const publicUrl = config.public.cloudflarePublicUrl;

  // Validate credentials are configured
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw createError({
      statusCode: 500,
      message: 'Cloudflare R2 credentials not configured',
    });
  }

  // ============================================
  // 7. INITIALIZE S3 CLIENT FOR R2
  // ============================================
  // Cloudflare R2 is S3-compatible, so we use AWS SDK
  const s3Client = new S3Client({
    region: 'auto', // R2 uses 'auto' region
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`, // R2 endpoint
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

  // ============================================
  // 8. CREATE PUT OBJECT COMMAND
  // ============================================
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
    // Add metadata for tracking
    Metadata: {
      'upload-timestamp': timestamp.toString(),
      'original-filename': fileName,
      'image-type': imageType,
    },
  });

  // ============================================
  // 9. GENERATE PRESIGNED URL
  // ============================================
  try {
    const expiresIn = 300; // 5 minutes (in seconds)

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn,
    });

    // ============================================
    // 10. CONSTRUCT PUBLIC URL
    // ============================================
    // This is the URL where the image will be accessible after upload
    const imagePublicUrl = `${publicUrl}/${key}`;

    // ============================================
    // 11. RETURN RESPONSE
    // ============================================
    return {
      uploadUrl: uploadUrl, // Temporary presigned URL for upload
      publicUrl: imagePublicUrl, // Permanent public URL after upload
      key: key, // R2 object key (for deletion if needed)
      expiresIn: expiresIn, // How long URL is valid (seconds)
      bucket: bucketName, // Bucket name (for reference)
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to generate upload URL',
    });
  }
});
