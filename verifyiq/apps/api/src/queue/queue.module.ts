// apps/api/src/queue/queue.module.ts
import { Module } from '@nestjs/common';

// BullMQ queue module — uses Redis for async job processing
// Jobs are enqueued by VerifyService and processed by QueueWorker

@Module({})
export class QueueModule {}
