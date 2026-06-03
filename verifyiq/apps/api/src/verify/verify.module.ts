// apps/api/src/verify/verify.module.ts
import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { MlClientModule } from '../ml-client/ml-client.module';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [MlClientModule, FraudModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
