import fs from 'fs';
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
  },
  forcePathStyle: true
});

/**
 * Upload a file to Cloudflare R2 storage
 * @param {string} filePath - Local path to the file to upload
 * @param {string} key - The object key (filename/path) in the bucket
 * @returns {Promise<string>} - Resolves to the uploaded file's key or URL path
 */
export default async function uploadChunksToR2(filePath, key) {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: R2_BUCKET_CHUNKS,
      Key: key,
      Body: fileContent,
      ContentType: 'text/plain; charset=utf-8'
    };

    await s3.send(new PutObjectCommand(params));

    return key;
  } catch (err) {
    console.error(`Error uploading chunk ${key} to R2:`, err);
    throw err;
  }
}
