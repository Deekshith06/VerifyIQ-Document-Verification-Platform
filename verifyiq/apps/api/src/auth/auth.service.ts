// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Hash an incoming API key for DB lookup */
  hashApiKey(rawKey: string): string {
    const salt = this.config.getOrThrow<string>('API_KEY_SALT');
    return crypto.createHash('sha256').update(rawKey + salt).digest('hex');
  }

  /** Validate API key → return orgId or throw */
  async validateApiKey(rawKey: string): Promise<{ orgId: string; keyId: string }> {
    const hashed = this.hashApiKey(rawKey);
    const record = await this.prisma.apiKey.findUnique({
      where: { hashedKey: hashed },
    });

    if (!record || record.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    return { orgId: record.orgId, keyId: record.id };
  }

  /** Generate a new API key — raw shown ONCE, hashed stored */
  async createApiKey(orgId: string, name?: string): Promise<{ keyId: string; rawKey: string }> {
    const rawKey = `viq_live_${crypto.randomBytes(32).toString('base64url')}`;
    const hashed = this.hashApiKey(rawKey);

    const record = await this.prisma.apiKey.create({
      data: { hashedKey: hashed, orgId, name },
    });

    return { keyId: record.id, rawKey };
  }

  /** Revoke an API key */
  async revokeApiKey(keyId: string, orgId: string): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: { id: keyId, orgId },
      data: { revokedAt: new Date() },
    });
  }

  /** Sign JWT for dashboard login */
  signToken(payload: Record<string, unknown>): string {
    return this.jwt.sign(payload);
  }
}
