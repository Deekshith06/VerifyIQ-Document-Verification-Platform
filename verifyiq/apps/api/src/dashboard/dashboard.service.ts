// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '../../../libs/types/src/index';

interface StatsQuery {
  startDate?: string;
  endDate?: string;
  documentType?: DocumentType;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(orgId: string, query: StatsQuery) {
    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.startDate || query.endDate
        ? {
            submittedAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [requests, avgRisk] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        orderBy: { submittedAt: 'asc' },
        select: { status: true, riskScore: true, submittedAt: true, documentType: true },
      }),
      this.prisma.verificationRequest.aggregate({
        where,
        _avg: { riskScore: true },
      }),
    ]);

    const total = requests.length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    const review   = requests.filter((r) => r.status === 'MANUAL_REVIEW').length;

    // 30-day timeline
    const timelineMap = new Map<string, { total: number; approved: number; rejected: number }>();
    for (const r of requests) {
      const date = r.submittedAt.toISOString().split('T')[0]!;
      const existing = timelineMap.get(date) ?? { total: 0, approved: 0, rejected: 0 };
      existing.total++;
      if (r.status === 'APPROVED') existing.approved++;
      if (r.status === 'REJECTED') existing.rejected++;
      timelineMap.set(date, existing);
    }
    const timeline = Array.from(timelineMap.entries()).map(([date, data]) => ({ date, ...data }));

    // Document type breakdown
    const typeMap = new Map<string, number>();
    for (const r of requests) {
      typeMap.set(r.documentType, (typeMap.get(r.documentType) ?? 0) + 1);
    }
    const documentTypeBreakdown = Array.from(typeMap.entries()).map(([type, count]) => ({
      type: type as DocumentType,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
    }));

    return {
      total,
      approved,
      rejected,
      review,
      avgRiskScore: parseFloat((avgRisk._avg.riskScore ?? 0).toFixed(3)),
      timeline,
      documentTypeBreakdown,
    };
  }
}
