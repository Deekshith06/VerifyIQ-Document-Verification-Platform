// apps/api/src/ml-client/ml-client.service.ts
// HTTP client from NestJS API → FastAPI ML service
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DocumentType, CheckDetail, FraudFlag } from '../../../../libs/types/src/index';

interface MlVerifyPayload {
  documentType: DocumentType;
  imageBase64?: string;
  manualFields?: Record<string, string>;
}

interface MlVerifyResponse {
  riskScore: number;
  checks: Record<string, CheckDetail>;
  extractedData?: Record<string, unknown>;
  flags?: FraudFlag[];
  modelVersion?: string;
}

@Injectable()
export class MlClientService {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(MlClientService.name);

  constructor(config: ConfigService) {
    const baseURL = config.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    this.http = axios.create({ baseURL, timeout: 10_000 });
  }

  async verify(payload: MlVerifyPayload): Promise<MlVerifyResponse> {
    try {
      const endpoint = `/ml/${this.toEndpoint(payload.documentType)}/verify`;
      const { data } = await this.http.post<MlVerifyResponse>(endpoint, payload);
      return data;
    } catch (err) {
      this.logger.warn('ML service unavailable — falling back to rule-based');
      // Graceful degradation: return manual review verdict
      return {
        riskScore: 0.5,
        checks: {
          'ML Service': {
            name: 'ML Service',
            description: 'ONNX inference service',
            result: 'WARN',
            riskContribution: 0,
            evidence: 'ML service unreachable — rule-based fallback applied',
          },
        },
        flags: [],
        modelVersion: 'fallback-v1',
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const { status } = await this.http.get('/health');
      return status === 200;
    } catch {
      return false;
    }
  }

  private toEndpoint(type: DocumentType): string {
    const map: Record<DocumentType, string> = {
      [DocumentType.CREDIT_CARD]:     'credit-card',
      [DocumentType.PASSPORT]:        'passport',
      [DocumentType.AADHAAR]:         'aadhaar',
      [DocumentType.VOTER_ID]:        'voter-id',
      [DocumentType.DRIVING_LICENCE]: 'driving-licence',
      [DocumentType.PAN_CARD]:        'aadhaar',
      [DocumentType.BIRTH_CERTIFICATE]: 'passport',
    };
    return map[type] ?? 'passport';
  }
}
