// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { VerifyModule } from './verify/verify.module';
import { FraudModule } from './fraud/fraud.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    VerifyModule,
    FraudModule,
  ],
})
export class AppModule {}
