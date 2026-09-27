import { existsSync } from 'node:fs';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  /** Connexions simultanées à PostgreSQL. 1 pour la base locale de « prisma dev ». */
  @IsInt()
  @Min(1)
  @Max(100)
  DATABASE_POOL_MAX: number = 10;

  @IsUrl({ require_tld: false })
  WEB_ORIGIN: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL_DAYS: number = 30;

  @IsIn([0, 1])
  TRUST_PROXY: number = 0;

  @IsIn(['local'])
  STORAGE_DRIVER: 'local' = 'local';

  @IsString()
  @MinLength(1)
  UPLOADS_DIR: string = 'uploads';

  /** Adresse publique sous laquelle les fichiers stockés sont servis. */
  @IsUrl({ require_tld: false })
  MEDIA_PUBLIC_URL: string;

  @IsString()
  @MinLength(32)
  REVALIDATE_SECRET: string;
}

/** Configuration validée au démarrage : l'API refuse de démarrer si une variable manque. */
export class AppConfig {
  readonly isProduction: boolean;
  readonly port: number;
  readonly databaseUrl: string;
  readonly databasePoolMax: number;
  readonly webOrigin: string;
  readonly jwtAccessSecret: string;
  readonly jwtAccessTtlSeconds: number;
  readonly refreshTokenTtlDays: number;
  readonly trustProxy: boolean;
  readonly storageDriver: 'local';
  readonly uploadsDir: string;
  readonly mediaPublicUrl: string;
  readonly revalidateSecret: string;

  constructor(env: EnvironmentVariables) {
    this.isProduction = env.NODE_ENV === 'production';
    this.port = env.PORT;
    this.databaseUrl = env.DATABASE_URL;
    this.databasePoolMax = env.DATABASE_POOL_MAX;
    this.webOrigin = env.WEB_ORIGIN;
    this.jwtAccessSecret = env.JWT_ACCESS_SECRET;
    this.jwtAccessTtlSeconds = env.JWT_ACCESS_TTL_SECONDS;
    this.refreshTokenTtlDays = env.REFRESH_TOKEN_TTL_DAYS;
    this.trustProxy = env.TRUST_PROXY === 1;
    this.storageDriver = env.STORAGE_DRIVER;
    this.uploadsDir = env.UPLOADS_DIR;
    this.mediaPublicUrl = env.MEDIA_PUBLIC_URL.replace(/\/+$/, '');
    this.revalidateSecret = env.REVALIDATE_SECRET;
  }
}

export function loadEnvFile(): void {
  if (existsSync('.env')) process.loadEnvFile('.env');
}

export function loadConfig(): AppConfig {
  loadEnvFile();
  const env = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
    excludeExtraneousValues: false,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property} : ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(
      `Configuration invalide. Vérifiez le fichier apps/api/.env (modèle : .env.example) :\n${details}`,
    );
  }
  return new AppConfig(env);
}
