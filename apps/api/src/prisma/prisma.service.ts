import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfig } from '../config/app-config.js';
import { PrismaClient } from '../generated/prisma/client.js';

export function createPrismaClient(databaseUrl: string, poolMax = 1): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: poolMax }) });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfig) {
    super({
      adapter: new PrismaPg({ connectionString: config.databaseUrl, max: config.databasePoolMax }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
