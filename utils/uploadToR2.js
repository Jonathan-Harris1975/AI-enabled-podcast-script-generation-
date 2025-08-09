// utils/uploadToR2.js
import fs from 'fs/promises';
import { s3, config } from './r2Config.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getLogger } from './logger.js';

const logger = getLogger('R2-Upload');

/**
 * Uploads any file type to R2 with proper content type detection
 * @param {string} localFilePath - Absolute path to local file
 * @param {string} remoteKey - Destination path in R2 (e.g. 'transcripts/123.txt')
 * @param {object} [options] - Additional options
 * @param {string} [options.contentType] - Force content type
 * @param {string} [options.bucket] - Override target bucket
 * @returns {Promise<string>} Public URL of uploaded file
 */
export default async function uploadToR2(localFilePath, remoteKey, options = {}) {
  try {
    const fileBuffer = await fs.readFile(localFilePath);
    const fileExt = path.extname(localFilePath).toLowerCase();
    
    const contentType = options.contentType || 
      ({
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg'
      }[fileExt] || 'application/octet-stream');

    const command = new PutObjectCommand({
      Bucket: options.bucket || config.buckets.transcripts,
      Key: remoteKey,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        'source-file': path.basename(localFilePath)
      }
    });

    await s3.send(command);
    
    const publicUrl = `${config.publicBaseUrl}/${remoteKey}`;
    logger.success(`Uploaded ${localFilePath} to ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    logger.error(`Failed to upload ${localFilePath}:`, error);
    throw new Error(`R2 upload failed: ${error.message}`);
  }
}
