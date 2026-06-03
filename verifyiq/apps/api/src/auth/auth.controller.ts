// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Delete, Param, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;
}

@ApiTags('api-keys')
@Controller('api-keys')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new API key (raw key shown ONCE)' })
  @ApiResponse({ status: 201, description: 'API key created' })
  async createKey(
    @Request() req: { user: { orgId: string } },
    @Body() dto: CreateApiKeyDto,
  ) {
    const { keyId, rawKey } = await this.auth.createApiKey(req.user.orgId, dto.name);
    return {
      keyId,
      rawKey, // Shown exactly once — never retrievable again
      message: 'Store this key securely. It will not be shown again.',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 204 })
  async revokeKey(
    @Request() req: { user: { orgId: string } },
    @Param('id') keyId: string,
  ) {
    await this.auth.revokeApiKey(keyId, req.user.orgId);
  }
}
