import type { SoothmarkAudit } from "@/types/audit";
import { parseSoothmarkAudit } from "@/lib/auditSchema";

export const mockCertifiedAudit: SoothmarkAudit = {
  classification: "certified",
  intent: "A simple deterministic storage contract that stores user-provided messages and update counts.",
  nondeterminism: {
    present: false,
    evidence: ["No executable gl.nondet.* calls are present in the submitted contract."],
  },
  state_impact: {
    present: false,
    evidence: ["State updates use method arguments and deterministic counter increments only."],
  },
  validation: {
    mechanism: "none",
    properly_used: true,
    evidence: ["Validation/equivalence is not required because nondeterministic output does not affect state."],
    explanation: "The contract has deterministic state writes, so Soothmark does not require a GenLayer validation mechanism.",
  },
  recommendations: [],
};

export const mockRejectedAudit: SoothmarkAudit = {
  classification: "rejected",
  intent: "A contract that fetches web or API output and stores the returned value in contract state.",
  nondeterminism: {
    present: true,
    evidence: ["Executable web access is visible through gl.nondet.web.get(...)."],
  },
  state_impact: {
    present: true,
    evidence: ["The fetched value can be assigned to self.* state after the nondeterministic call."],
  },
  validation: {
    mechanism: "none",
    properly_used: false,
    evidence: ["No executable strict_eq, run_nondet_unsafe, prompt_comparative, or prompt_non_comparative path is visible."],
    explanation: "Nondeterministic web output can affect saved state without an appropriate validation/equivalence mechanism.",
  },
  recommendations: [
    "Wrap the state-changing nondeterministic path with gl.vm.run_nondet_unsafe and a validator function.",
    "Use gl.eq_principle.strict_eq when the accepted web result must match exactly across validators.",
    "Use an appropriate GenLayer equivalence mechanism before writing fetched output to state.",
  ],
};

export const mockConditionalAudit: SoothmarkAudit = {
  classification: "conditional",
  intent: "A contract that stores an AI or web-generated result with some semantic validation.",
  nondeterminism: {
    present: true,
    evidence: ["Executable prompt or web nondeterminism is visible in the submitted contract."],
  },
  state_impact: {
    present: true,
    evidence: ["The generated result appears able to influence persistent contract state."],
  },
  validation: {
    mechanism: "prompt_comparative",
    properly_used: true,
    evidence: ["prompt_comparative is present as the visible validation/equivalence mechanism."],
    explanation: "The contract uses semantic comparison, but Soothmark would review whether the comparative rule is tight enough for the stored value.",
  },
  recommendations: [
    "Tighten the comparative prompt so materially different stored values cannot be accepted as equivalent.",
    "Document exactly which generated fields validators must treat as equivalent before state is updated.",
  ],
};

function validateMockAudit(auditId: string, audit: SoothmarkAudit): SoothmarkAudit {
  try {
    return parseSoothmarkAudit(audit);
  } catch (error) {
    throw new Error(`Mock audit ${auditId} does not match the locked Soothmark schema. ${String(error)}`);
  }
}

export const mockAuditsById: Record<string, SoothmarkAudit> = {
  "mock-001": validateMockAudit("mock-001", mockCertifiedAudit),
  "mock-002": validateMockAudit("mock-002", mockRejectedAudit),
  "mock-003": validateMockAudit("mock-003", mockConditionalAudit),
};

export const mockAuditOwners: Record<string, string> = {
  "mock-001": "0x1111111111111111111111111111111111111111",
  "mock-002": "0x2222222222222222222222222222222222222222",
  "mock-003": "0x1111111111111111111111111111111111111111",
};

export const mockAudit = mockConditionalAudit;
