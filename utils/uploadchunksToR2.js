import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL;
} = process.env;

// Validate required environment variables
if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_CHUNKS || !R2_ENDPOINT) {
  throw new Error('Missing one or more required R2 environment variables.');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_PUBLIC_BASE_URL,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

/**
 * Uploads a file to R2.
 * @param {string} localFilePath - Full path to the file to upload
 * @param {string} r2Key - The key in R2 bucket (e.g. 'raw-text/sessionId/chunk-0.txt')
 * @returns {Promise<string>} - R2 URL or key
 */
export async function uploadchunksToR2(localFilePath, r2Key) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(localFilePath, 'utf-8');

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_CHUNKS,
      Key: r2Key,
      Body: fileContent,
      ContentType: 'text/plain'
    });

    await s3.send(command);
    console.log(`✅ Uploaded to R2: ${r2Key}`);
    return `https://${R2_PUBLIC_BASE_URL.replace(/^https?:\/\//, '')}.${R2_BUCKET_CHUNKS}/${r2Key}`;
  } catch (error) {
    console.error(`❌ Failed to upload ${r2Key}:`, error);
    throw error;
  }
}
