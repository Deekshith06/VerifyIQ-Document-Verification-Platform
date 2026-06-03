// apps/api/src/fraud/fraud.module.ts
import { Module } from '@nestjs/common';
import { ReasoningService } from './reasoning.service';

@Module({
  providers: [ReasoningService],
  exports: [ReasoningService],
})
export class FraudModule {}
