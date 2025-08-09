// utils/uploadToR2.js
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL_1 // e.g. https://your-bucket.r2.cloudflarestorage.com
} = process.env;

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

/**
 * Uploads a file from disk to R2 and returns the public URL.
 * 
 * @param {string} localFilePath - Full path to local file
 * @param {string} remoteKey - Key to use in R2 (e.g. 'raw-text/123/chunk-1.txt')
 * @returns {Promise<string>} - Public R2 URL of the uploaded file
 */
export default async function uploadToR2(localFilePath, remoteKey) {
  const fileBuffer = fs.readFileSync(localFilePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: remoteKey,
    Body: fileBuffer,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const publicUrl = `${R2_PUBLIC_BASE_URL_1}${R2_BUCKET_CHUNKS}${remoteKey}`;
  return publicUrl;
}
