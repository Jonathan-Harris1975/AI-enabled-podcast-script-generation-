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

export default async function uploadToR2(filePath, key) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_TRANSCRIPTS,  // <--- Use correct bucket here
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const baseUrl = R2_PUBLIC_BASE_URL.endsWith('/') ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
  const keyPath = key.startsWith('/') ? key : `/${key}`;

  const publicUrl = `${baseUrl}${keyPath}`;
  console.log(`✅ Uploaded transcript: ${publicUrl}`);
  return publicUrl;
}
