// apps/api/src/audit/audit.controller.ts
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AuditService } from './audit.service';

class AuditLogsQuery {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional() @IsString() requestId?: string;
}

@ApiTags('audit')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('audit/logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Cursor-paginated immutable audit trail' })
  async getLogs(
    @Request() req: { orgId: string },
    @Query() query: AuditLogsQuery,
  ) {
    return this.audit.getLogs(
      req.orgId,
      query.cursor,
      query.limit ? parseInt(query.limit, 10) : 50,
      query.requestId,
    );
  }
}
