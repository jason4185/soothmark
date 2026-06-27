export type AuditClassification = "certified" | "conditional" | "rejected";

export type ValidationMechanism =
  | "strict_eq"
  | "run_nondet_unsafe"
  | "prompt_comparative"
  | "prompt_non_comparative"
  | "none";

export type SoothmarkAudit = {
  classification: AuditClassification;
  intent: string;
  nondeterminism: {
    present: boolean;
    evidence: string[];
  };
  state_impact: {
    present: boolean;
    evidence: string[];
  };
  validation: {
    mechanism: ValidationMechanism;
    properly_used: boolean;
    evidence: string[];
    explanation: string;
  };
  recommendations: string[];
};
