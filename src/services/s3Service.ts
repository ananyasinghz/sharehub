import { uploadData, downloadData, remove } from '@aws-amplify/storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fetchAuthSession } from '@aws-amplify/auth';
import { env } from '../config/aws';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  downloadUrl: string;
}

class S3Service {
  private s3Client: S3Client | null = null;

  private async getS3Client(): Promise<S3Client> {
    if (!this.s3Client) {
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      if (!credentials) {
        throw new Error('No AWS credentials available');
      }

      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });
    }

    return this.s3Client;
  }

  /**
   * Upload a file directly using Amplify Storage
   */
  async uploadFile(file: File, folder: string = 'listings'): Promise<UploadResult> {
    try {
      const fileExtension = file.name.split('.').pop();
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
          level: 'public'
        }
      }).result;

      // Get the public URL
      const url = await this.getFileUrl(key);

      return {
        key: result.key,
        url
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Get a presigned URL for direct upload from frontend
   */
  async getPresignedUploadUrl(fileName: string, fileType: string, folder: string = 'listings'): Promise<PresignedUrlResult> {
    try {
      const s3Client = await this.getS3Client();
      const fileExtension = fileName.split('.').pop();
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      const putObjectCommand = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: fileType,
        ACL: 'public-read'
      });

      const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: 300 // 5 minutes
      });

      const downloadUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        key,
        downloadUrl
      };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Upload file using presigned URL
   */
  async uploadWithPresignedUrl(file: File, presignedUrl: string): Promise<void> {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading with presigned URL:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Get public URL for a file
   */
  async getFileUrl(key: string): Promise<string> {
    try {
      const result = await downloadData({
        key,
        options: {
          level: 'public'
        }
      }).result;

      // For public files, construct the direct URL
      return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error getting file URL:', error);
      // Return a fallback public URL structure
      return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await remove({
        key,
        options: {
          level: 'public'
        }
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get multiple file URLs
   */
  async getMultipleFileUrls(keys: string[]): Promise<{ [key: string]: string }> {
    const urls: { [key: string]: string } = {};

    for (const key of keys) {
      try {
        urls[key] = await this.getFileUrl(key);
      } catch (error) {
        console.error(`Error getting URL for key ${key}:`, error);
        urls[key] = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
      }
    }

    return urls;
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await downloadData({
        key,
        options: {
          level: 'public'
        }
      }).result;
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const s3Service = new S3Service();
