// utils/r2Config.js
import { S3Client } from '@aws-sdk/client-s3';

const requiredVars = [
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_ENDPOINT',
  'R2_PUBLIC_BASE_URL'
];

const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(`Missing R2 config: ${missingVars.join(', ')}`);
}

export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});

export const config = {
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  buckets: {
    chunks: process.env.R2_BUCKET_CHUNKS || 'podcast-chunks',
    transcripts: process.env.R2_BUCKET_TRANSCRIPTS || 'podcast-transcripts'
  }
};
