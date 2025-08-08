// utils/uploadToR2.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT
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
 * Uploads a file to R2.
 * @param {string} fileName - Name of the file to store (e.g. 'episode-001.txt')
 * @param {string} content - Plain text content to upload
 */
export async function uploadchunksToR2 (fileName, content) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_CHUNKS,
    Key: fileName,
    Body: content,
    ContentType: 'text/plain'
  });

  await s3.send(command);
}
