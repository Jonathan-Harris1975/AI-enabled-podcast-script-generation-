// utils/uploadChunksToR2.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT
} = process.env;

// Validate required environment variables
if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_CHUNKS || !R2_ENDPOINT) {
  throw new Error('Missing one or more required R2 environment variables.');
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
 * Uploads a file to R2.
 * @param {string} fileName - Name of the file to store (e.g. 'episode-001.txt')
 * @param {string} content - Plain text content to upload
 * @returns {Promise<void>}
 */
export async function uploadChunksToR2(fileName, content) {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_CHUNKS,
      Key: fileName,
      Body: content,
      ContentType: 'text/plain'
    });

    await s3.send(command);
    console.log(`✅ Successfully uploaded: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error);
    throw error;
  }
}      ContentType: 'text/plain'
    });

    await s3.send(command);
    console.log(`✅ Successfully uploaded: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error);
    throw error;
  }
}
