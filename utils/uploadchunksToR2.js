// utils/uploadchunksToR2.js
import { s3, config } from './r2Config.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getLogger } from './logger.js';

const logger = getLogger('R2-Chunks');

/**
 * Specialized uploader for podcast chunks with text processing
 * @param {string} filePath - Path to text chunk file
 * @param {string} key - Destination key (e.g. 'chunks/episode-1/part-1.txt')
 * @returns {Promise<string>} Public URL of uploaded chunk
 */
export default async function uploadchunksToR2(filePath, key) {
  try {
    const { readFile } = await import('fs/promises');
    let content = await readFile(filePath, 'utf8');

    // Process text content
    content = content
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .trim();

    const command = new PutObjectCommand({
      Bucket: config.buckets.chunks,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
      ContentEncoding: 'utf-8',
      Metadata: {
        'chunk-source': path.basename(filePath),
        'processed-at': new Date().toISOString()
      }
    });

    await s3.send(command);
    
    const publicUrl = `${config.publicBaseUrl}/${key}`;
    logger.success(`Uploaded chunk ${filePath} as ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    logger.error(`Chunk upload failed for ${filePath}:`, error);
    throw new Error(`Chunk upload failed: ${error.message}`);
  }
}
