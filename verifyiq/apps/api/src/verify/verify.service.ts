// apps/api/src/verify/verify.service.ts
import { GoneException, Injectable } from '@nestjs/common';
import { MlClientService } from '../ml-client/ml-client.service';
import { ReasoningService } from '../fraud/reasoning.service';
import {
  DocumentType,
  ExtractedFields,
  VerdictType,
  VERDICT_THRESHOLDS,
  VerificationResult,
} from '../../../../libs/types/src/index';
import { randomUUID } from 'crypto';

interface SubmitOptions {
  documentType: DocumentType;
  imageBase64?: string;
  imageBuffer?: Buffer;
  manualFields?: Record<string, string>;
  consentToken?: string;
}

@Injectable()
export class VerifyService {
  constructor(
    private readonly mlClient: MlClientService,
    private readonly reasoning: ReasoningService,
  ) {}

  async submit(opts: SubmitOptions): Promise<VerificationResult | { error: string; message: string }> {
    if (opts.documentType === DocumentType.AADHAAR && !opts.consentToken) {
      return { error: 'VIQ-011', message: 'Consent token required for Aadhaar verification' };
    }

    const start = Date.now();
    const payload: { documentType: DocumentType; imageBase64?: string; manualFields?: Record<string, string> } = {
      documentType: opts.documentType,
    };
    if (opts.imageBase64) payload.imageBase64 = opts.imageBase64;
    if (opts.manualFields) payload.manualFields = opts.manualFields;

    const mlResult = await this.mlClient.verify(payload);
    const checks = mlResult.checks;
    const verdict = this.scoreToVerdict(mlResult.riskScore);
    const reasoning = this.reasoning.buildReasoning(Object.values(checks), mlResult.riskScore);

    return {
      requestId: `session_${randomUUID()}`,
      documentType: opts.documentType,
      verdict,
      riskScore: mlResult.riskScore,
      reasoning,
      checks,
      extractedData: (mlResult.extractedData ?? {}) as unknown as ExtractedFields,
      flags: mlResult.flags ?? [],
      processingStages: [
        {
          stage: 'EPHEMERAL_VERIFICATION',
          durationMs: Date.now() - start,
          agentUsed: 'StatelessVerifyService',
          output: {
            persistence: 'none',
            imageBufferCleared: Boolean(opts.imageBuffer),
            resultRetention: 'response only',
          },
        },
      ],
      processingTimeMs: Date.now() - start,
      modelVersion: mlResult.modelVersion ?? 'stateless-v2.0.0',
    };
  }

  getResult() {
    throw new GoneException(
      'VerifyIQ is stateless. Results are returned once in the submit response and are not retained for later lookup.',
    );
  }

  getReasoning() {
    throw new GoneException(
      'VerifyIQ is stateless. Reasoning is returned with the submit response and is not retained for later lookup.',
    );
  }

  async submitBatch(opts: { documents: Array<{ documentType: DocumentType; imageBase64?: string; manualFields?: Record<string, string>; consentToken?: string }> }) {
    const results = await Promise.all(opts.documents.map((document) => this.submit(document)));
    return {
      batchId: `session_batch_${randomUUID()}`,
      retention: 'response only; no database rows, queue jobs, or audit entries created',
      results,
    };
  }

  private scoreToVerdict(score: number): VerdictType {
    if (score < VERDICT_THRESHOLDS.APPROVED) return 'APPROVED';
    if (score < VERDICT_THRESHOLDS.MANUAL_REVIEW) return 'MANUAL_REVIEW';
    return 'REJECTED';
  }
}
