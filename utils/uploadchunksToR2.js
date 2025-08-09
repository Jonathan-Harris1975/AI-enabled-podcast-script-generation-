import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL_1
} = process.env;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_CHUNKS || !R2_ENDPOINT || !R2_PUBLIC_BASE_URL_1) {
  throw new Error('Missing one or more required R2 environment variables for chunks.');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

/**
 * Upload chunk file to R2 and return its public URL
 * @param {string} filePath - Local file path
 * @param {string} key - Bucket key (e.g. 'raw-text/sessionId/chunk-1.txt')
 * @returns {Promise<string>} public URL
 */
export default async function uploadChunksToR2(filePath, key) {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_CHUNKS,
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const baseUrl = R2_PUBLIC_BASE_URL_1.endsWith('/')
    ? R2_PUBLIC_BASE_URL_1
    : R2_PUBLIC_BASE_URL_1 + '/';

  return baseUrl + key;
}
