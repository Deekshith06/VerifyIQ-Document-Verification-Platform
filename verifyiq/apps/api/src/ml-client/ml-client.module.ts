// apps/api/src/ml-client/ml-client.module.ts
import { Module } from '@nestjs/common';
import { MlClientService } from './ml-client.service';

@Module({
  providers: [MlClientService],
  exports: [MlClientService],
})
export class MlClientModule {}
