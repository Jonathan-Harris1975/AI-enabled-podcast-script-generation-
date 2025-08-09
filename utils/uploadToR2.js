import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL
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
 * @param {string} localFilePath
 * @param {string} remoteKey
 * @returns {Promise<string>}
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

  // Ensure slash between base URL and remoteKey
  const baseUrl = R2_PUBLIC_BASE_URL.endsWith('/')
    ? R2_PUBLIC_BASE_URL.slice(0, -1)
    : R2_PUBLIC_BASE_URL;
  const keyPath = remoteKey.startsWith('/') ? remoteKey : `/${remoteKey}`;

  const publicUrl = `${baseUrl}${keyPath}`;
  return publicUrl;
}
