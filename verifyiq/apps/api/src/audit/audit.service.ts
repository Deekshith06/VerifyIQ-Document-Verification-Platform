// apps/api/src/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogInput {
  requestId?: string;
  event: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'ACCESSED' | 'DELETED';
  actor: string;
  ipAddress: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          requestId: input.requestId,
          event: input.event,
          actor: input.actor,
          ipAddress: input.ipAddress,
          metadata: (input.metadata ?? null) as object | null,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed:', err);
    }
  }

  async getLogs(orgId: string, cursor?: string, limit = 50, requestId?: string) {
    const where = requestId
      ? { requestId, request: { orgId } }
      : { request: { orgId } };

    const items = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    return {
      items: data,
      nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
    };
  }
}
