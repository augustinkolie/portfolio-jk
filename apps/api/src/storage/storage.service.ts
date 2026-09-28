import type { Readable } from 'node:stream';

export interface StoredFile {
  stream: Readable;
  size: number;
}

/**
 * Abstraction du stockage des fichiers (cahier des charges 2) : dossier local en
 * développement, stockage compatible S3 en production. Les clés sont des chemins
 * relatifs (« media/<id>/800.webp ») : seule l'URL publique dépend du pilote.
 */
export abstract class StorageService {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Lecture en flux (fichiers relayés par l'API) ; null si le fichier n'existe pas. */
  abstract open(key: string): Promise<StoredFile | null>;

  /** Supprime tous les fichiers dont la clé commence par ce préfixe. */
  abstract deletePrefix(prefix: string): Promise<void>;

  abstract publicUrl(key: string): string;
}
