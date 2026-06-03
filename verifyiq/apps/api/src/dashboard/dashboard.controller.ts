// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { DashboardService } from './dashboard.service';
import { DocumentType } from '../../../libs/types/src/index';

class DashboardStatsQuery {
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
}

@ApiTags('dashboard')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Org-level KPIs + verification timeline' })
  async getStats(
    @Request() req: { orgId: string },
    @Query() query: DashboardStatsQuery,
  ) {
    return this.dashboard.getStats(req.orgId, query);
  }
}
