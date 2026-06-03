// apps/api/src/auth/strategies/api-key.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly auth: AuthService) {
    super();
  }

  async validate(req: Request): Promise<{ orgId: string; keyId: string }> {
    const rawKey = req.headers['x-api-key'] as string | undefined;
    if (!rawKey) throw new Error('Missing X-API-Key');
    return this.auth.validateApiKey(rawKey);
  }
}
