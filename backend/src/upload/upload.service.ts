import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

const UPLOADS_DIR = 'uploads';

@Injectable()
export class UploadService {
  private readonly uploadsPath: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.uploadsPath = join(process.cwd(), UPLOADS_DIR);
    this.publicBaseUrl = this.config.get<string>('UPLOAD_PUBLIC_URL') || 'http://localhost:3000';
    if (!existsSync(this.uploadsPath)) {
      mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  async saveImage(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname?.match(/\.[a-zA-Z0-9]+$/)?.[0] || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(this.uploadsPath, filename);
    return new Promise((resolve, reject) => {
      const ws = createWriteStream(filepath);
      ws.on('finish', () => {
        const url = `${this.publicBaseUrl.replace(/\/$/, '')}/${UPLOADS_DIR}/${filename}`;
        resolve(url);
      });
      ws.on('error', reject);
      if (file.buffer) {
        ws.write(file.buffer);
        ws.end();
      } else {
        reject(new Error('File buffer not available'));
      }
    });
  }
}
