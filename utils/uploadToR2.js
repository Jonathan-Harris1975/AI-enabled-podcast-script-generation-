import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_ENDPOINT,
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
 * Upload file to R2 with explicit bucket & baseUrl
 * @param {string} localFilePath
 * @param {string} remoteKey
 * @param {string} bucket
 * @param {string} baseUrl
 * @returns {Promise<string>} public URL
 */
export default async function uploadToR2(localFilePath, remoteKey, bucket, baseUrl) {
  const fileBuffer = fs.readFileSync(localFilePath);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: remoteKey,
    Body: fileBuffer,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  // Normalize URL slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanKey = remoteKey.startsWith('/') ? remoteKey : `/${remoteKey}`;

  return `${cleanBaseUrl}${cleanKey}`;
}
