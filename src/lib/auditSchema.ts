import { z } from "zod";

export const auditClassificationSchema = z.enum(["certified", "conditional", "rejected"]);

export const validationMechanismSchema = z.enum([
  "strict_eq",
  "run_nondet_unsafe",
  "prompt_comparative",
  "prompt_non_comparative",
  "none",
]);

export const soothmarkAuditSchema = z.object({
  classification: auditClassificationSchema,
  intent: z.string(),
  nondeterminism: z.object({
    present: z.boolean(),
    evidence: z.array(z.string()),
  }),
  state_impact: z.object({
    present: z.boolean(),
    evidence: z.array(z.string()),
  }),
  validation: z.object({
    mechanism: validationMechanismSchema,
    properly_used: z.boolean(),
    evidence: z.array(z.string()),
    explanation: z.string(),
  }),
  recommendations: z.array(z.string()),
});

export type ParsedSoothmarkAudit = z.infer<typeof soothmarkAuditSchema>;

export function parseSoothmarkAudit(value: unknown): ParsedSoothmarkAudit {
  return soothmarkAuditSchema.parse(value);
}

export function safeParseSoothmarkAudit(value: unknown) {
  return soothmarkAuditSchema.safeParse(value);
}
