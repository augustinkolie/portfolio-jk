import { Global, Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  // Le pilote S3 viendra s'ajouter ici, choisi selon STORAGE_DRIVER.
  providers: [{ provide: StorageService, useClass: LocalStorageService }],
  exports: [StorageService],
})
export class StorageModule {}
