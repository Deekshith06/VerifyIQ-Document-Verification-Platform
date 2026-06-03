// apps/api/src/auth/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      orgId?: string;
      keyId?: string;
    }>();

    const rawKey = request.headers['x-api-key'];
    if (!rawKey) throw new UnauthorizedException('Missing X-API-Key header');

    const { orgId, keyId } = await this.auth.validateApiKey(rawKey);
    request.orgId = orgId;
    request.keyId = keyId;

    // Set RLS context for this request's DB session
    await this.prisma.setOrgContext(orgId);
    return true;
  }
}
