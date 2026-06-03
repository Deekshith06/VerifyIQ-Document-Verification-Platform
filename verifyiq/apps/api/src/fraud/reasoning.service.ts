// apps/api/src/fraud/reasoning.service.ts
import { Injectable } from '@nestjs/common';
import {
  CheckDetail, FraudReasoning, RiskBreakdown,
} from '../../../../libs/types/src/index';

// Check name categories for layer attribution
const CHECKSUM_CHECKS = new Set([
  'Luhn Checksum', 'Verhoeff Checksum', 'MRZ Checksum', 'MRZ Composite Checksum',
  'MRZ DOB Checksum', 'MRZ Expiry Checksum', 'MRZ Personal Number Checksum',
  'EPIC Format Validation', 'DL Format Validation', 'UIDAI QR Signature',
  'Aadhaar Format Check',
]);

const VISUAL_CHECKS = new Set([
  'ELA Tamper Detection', 'Face Detection', 'Document Classification',
  'Hologram Detection', 'UIDAI Logo Detection', 'ECI Logo Detection',
  'Image Quality', 'Signature Stripe Detection', 'Color Scheme Validation',
]);

@Injectable()
export class ReasoningService {
  buildReasoning(checks: CheckDetail[], riskScore: number): FraudReasoning {
    const failing  = checks.filter((c) => c.result === 'FAIL')
                           .sort((a, b) => b.riskContribution - a.riskContribution);
    const passing  = checks.filter((c) => c.result === 'PASS');
    const neutral  = checks.filter((c) => c.result === 'N/A' || c.result === 'WARN');
    const dominant = failing[0];

    const riskBreakdown = this.computeBreakdown(checks, riskScore);

    return {
      summary: this.buildSummary(failing, riskScore),
      passingChecks: passing,
      failingChecks: failing,
      neutralChecks: neutral,
      dominantFactor: dominant?.name ?? 'None',
      dominantFactorWeight: dominant?.riskContribution ?? 0,
      verdictExplanation: this.buildExplanation(failing, riskScore),
      riskBreakdown,
    };
  }

  private buildSummary(failing: CheckDetail[], score: number): string {
    if (failing.length === 0) return 'All verification checks passed. Document appears authentic.';
    if (failing.length === 1) return `1 critical check failed: ${failing[0]!.name}.`;
    const names = failing.slice(0, 2).map((f) => f.name).join(' and ');
    return `${failing.length} checks failed — dominant: ${names}.`;
  }

  private buildExplanation(failing: CheckDetail[], score: number): string {
    if (failing.length === 0) {
      return 'All verification checks passed. The document passed structural, algorithmic, and visual integrity tests. Risk score is below the approval threshold.';
    }
    const verdict = score > 0.65 ? 'appears fraudulent' : 'requires manual review';
    const top2    = failing.slice(0, 2).map((f) => f.name).join(' and ');
    const pct     = (score * 100).toFixed(0);
    const threshold = score > 0.65 ? 'rejection (65%)' : 'review (35%)';
    return (
      `The document ${verdict}. Primary concerns: ${top2}. ` +
      `Risk score ${pct}% exceeds the ${threshold} threshold. ` +
      `${failing.length > 2 ? `Additionally, ${failing.length - 2} further check(s) failed.` : 'Immediate review is recommended.'}`
    );
  }

  private computeBreakdown(checks: CheckDetail[], total: number): RiskBreakdown {
    const sum = (names: Set<string>) =>
      checks
        .filter((c) => names.has(c.name) && c.result === 'FAIL')
        .reduce((acc, c) => acc + c.riskContribution, 0);

    const checksumLayer = parseFloat(sum(CHECKSUM_CHECKS).toFixed(3));
    const visualLayer   = parseFloat(sum(VISUAL_CHECKS).toFixed(3));
    const logicLayer    = parseFloat(
      Math.max(0, total - checksumLayer - visualLayer).toFixed(3)
    );

    return { checksumLayer, visualLayer, logicLayer, total };
  }
}
