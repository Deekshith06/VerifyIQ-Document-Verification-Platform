// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ PostgreSQL connected via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setOrgContext(orgId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${orgId.replace(/'/g, "''")}'`
    );
  }
}
