import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { StorageService, type StoredFile } from './storage.service.js';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly root: string;

  constructor(private readonly config: AppConfig) {
    super();
    this.root = resolve(config.uploadsDir);
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async open(key: string): Promise<StoredFile | null> {
    const path = this.resolveKey(key);
    try {
      const { size, isFile } = await stat(path).then((s) => ({ size: s.size, isFile: s.isFile() }));
      return isFile ? { stream: createReadStream(path), size } : null;
    } catch {
      return null;
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    await rm(this.resolveKey(prefix), { recursive: true, force: true });
  }

  publicUrl(key: string): string {
    return `${this.config.mediaPublicUrl}/${key}`;
  }

  /** Empêche toute clé de sortir du dossier uploads (« ../ »). */
  private resolveKey(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error(`Clé de stockage invalide : ${key}`);
    return path;
  }
}
