// utils/uploadToR2.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_TRANSCRIPTS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL
} = process.env;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_TRANSCRIPTS || !R2_ENDPOINT || !R2_PUBLIC_BASE_URL) {
  throw new Error('Missing one or more required R2 environment variables for transcripts.');
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
 * Upload transcript file to R2
 * @param {string} filePath - Local path to file
 * @param {string} key - Destination key in bucket
 * @returns {Promise<string>} - Public URL of uploaded transcript
 */
export default async function uploadToR2(filePath, key) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_TRANSCRIPTS,
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;
  console.log(`✅ Uploaded transcript: ${publicUrl}`);
  return publicUrl;
}
