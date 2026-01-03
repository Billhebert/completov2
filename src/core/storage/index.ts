// src/core/storage/index.ts
import * as Minio from 'minio';
import { env } from '../config/env';
import { logger } from '../logger';
import { randomBytes } from 'crypto';

export class StorageService {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
    this.bucket = env.MINIO_BUCKET;
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        logger.info({ bucket: this.bucket }, 'MinIO bucket created');
      }
    } catch (error) {
      logger.error({ error, bucket: this.bucket }, 'Failed to ensure bucket');
    }
  }

  /**
   * Upload file to MinIO
   */
  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    folder = 'uploads'
  ): Promise<string> {
    const fileId = randomBytes(16).toString('hex');
    const ext = filename.split('.').pop();
    const objectName = `${folder}/${fileId}.${ext}`;

    try {
      await this.client.putObject(this.bucket, objectName, file, file.length, {
        'Content-Type': contentType,
        'X-Original-Name': filename,
      });

      logger.info({ objectName, size: file.length }, 'File uploaded to MinIO');

      return objectName;
    } catch (error) {
      logger.error({ error, objectName }, 'Failed to upload file');
      throw error;
    }
  }

  /**
   * Get file URL (presigned)
   */
  async getUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.bucket,
        objectName,
        expirySeconds
      );
    } catch (error) {
      logger.error({ error, objectName }, 'Failed to generate URL');
      throw error;
    }
  }

  /**
   * Download file
   */
  async download(objectName: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucket, objectName);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error({ error, objectName }, 'Failed to download file');
      throw error;
    }
  }

  /**
   * Delete file
   */
  async delete(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
      logger.info({ objectName }, 'File deleted from MinIO');
    } catch (error) {
      logger.error({ error, objectName }, 'Failed to delete file');
      throw error;
    }
  }

  /**
   * List files in folder
   */
  async list(folder = ''): Promise<string[]> {
    const stream = this.client.listObjects(this.bucket, folder, true);
    const objects: string[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push(obj.name);
        }
      });
      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }
}

// Singleton
let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}
