# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json


SOOTHMARK_STANDARD_URL = "https://soothmark-verification-standard.netlify.app/standard.json"


class Soothmark(gl.Contract):
    audits: TreeMap[str, str]
    audit_owners: TreeMap[str, str]
    user_audits: TreeMap[str, str]
    audit_count: u256
    last_audit_id: str

    def __init__(self):
        self.audit_count = u256(0)
        self.last_audit_id = ""

    def _coerce_bool(self, value):
        if value is True or value == 1:
            return True
        if value is False or value == 0:
            return False
        if isinstance(value, str):
            text = value.strip().lower()
            if text in ["true", "yes", "present", "detected", "1"]:
                return True
            if text in ["false", "no", "absent", "not detected", "0"]:
                return False
        return None

    def _repair_audit_shape(self, audit: dict) -> dict:
        if not isinstance(audit, dict):
            return audit
        for field in ["nondeterminism", "state_impact", "validation"]:
            if not isinstance(audit.get(field), dict):
                audit[field] = {}

        if not isinstance(audit.get("intent"), str):
            audit["intent"] = str(audit.get("intent", ""))

        classification = audit.get("classification", "conditional")
        if isinstance(classification, str):
            classification = classification.strip().lower()
        if classification not in ["certified", "conditional", "rejected"]:
            classification = "conditional"
        audit["classification"] = classification

        for field in ["nondeterminism", "state_impact"]:
            value = self._coerce_bool(audit[field].get("present"))
            audit[field]["present"] = value if value is not None else False
            evidence = audit[field].get("evidence", [])
            audit[field]["evidence"] = [str(item) for item in evidence] if isinstance(evidence, list) else []

        mechanism = audit["validation"].get("mechanism", "none")
        if isinstance(mechanism, str):
            mechanism = mechanism.strip().lower()
        if mechanism not in ["strict_eq", "run_nondet_unsafe", "prompt_comparative", "prompt_non_comparative", "none"]:
            mechanism = "none"
        audit["validation"]["mechanism"] = mechanism

        value = self._coerce_bool(audit["validation"].get("properly_used"))
        if value is not None:
            audit["validation"]["properly_used"] = value
        else:
            audit["validation"]["properly_used"] = False

        evidence = audit["validation"].get("evidence", [])
        audit["validation"]["evidence"] = [str(item) for item in evidence] if isinstance(evidence, list) else []
        if not isinstance(audit["validation"].get("explanation"), str):
            audit["validation"]["explanation"] = str(audit["validation"].get("explanation", ""))

        recommendations = audit.get("recommendations", [])
        audit["recommendations"] = [str(item) for item in recommendations if str(item) != ""] if isinstance(recommendations, list) else []

        combined_validation_text = (
            audit["validation"]["explanation"] + " "
            + " ".join(audit["validation"]["evidence"]) + " "
            + " ".join(audit["recommendations"])
        ).lower()
        weak_validator_phrases = [
            "minimal",
            "lightweight",
            "shape",
            "schema",
            "structure",
            "json structure",
            "classification",
            "classification field",
            "classification values",
            "allowed values",
            "valid values",
            "malformed",
            "score",
            "0-100",
            "not substantive",
            "does not perform substantive",
            "does not verify",
            "does not check",
            "only checks",
            "only validates",
            "field validity",
            "validity",
            "unclear",
            "incomplete",
            "weak",
        ]
        has_weak_validator_finding = False
        for phrase in weak_validator_phrases:
            if phrase in combined_validation_text:
                has_weak_validator_finding = True

        if (
            classification == "certified"
            and mechanism == "run_nondet_unsafe"
            and has_weak_validator_finding
        ):
            audit["classification"] = "conditional"
            classification = "conditional"
            audit["validation"]["properly_used"] = False
            recommendation = "Strengthen the validator to perform substantive equivalence checking of the audit result against the submitted contract and the SoothMark Verification Standard."
            if recommendation not in audit["recommendations"]:
                audit["recommendations"].append(recommendation)

        validation_not_required = (
            audit["nondeterminism"]["present"] is False
            and audit["state_impact"]["present"] is False
            and mechanism == "none"
        )
        if validation_not_required:
            audit["validation"]["properly_used"] = True
        elif classification == "rejected":
            audit["validation"]["properly_used"] = False
        elif classification == "conditional" and mechanism != "none":
            audit["validation"]["properly_used"] = False
        elif has_weak_validator_finding:
            audit["validation"]["properly_used"] = False
        elif classification == "certified":
            audit["validation"]["properly_used"] = True
        else:
            audit["validation"]["properly_used"] = False
        return audit

    def _audit_shape_error(self, audit: dict) -> str:
        if not isinstance(audit, dict):
            return "audit is not a dict"
        for field in ["classification", "intent", "nondeterminism", "state_impact", "validation", "recommendations"]:
            if field not in audit:
                return "missing field: " + field
        if audit["classification"] not in ["certified", "conditional", "rejected"]:
            return "invalid classification"
        if not isinstance(audit["intent"], str):
            return "intent must be a string"
        for field in ["nondeterminism", "state_impact"]:
            item = audit[field]
            if not isinstance(item, dict):
                return field + " must be a dict"
            if not isinstance(item.get("present"), bool):
                return field + ".present must be bool"
            if not isinstance(item.get("evidence"), list):
                return field + ".evidence must be list"
            for evidence in item["evidence"]:
                if not isinstance(evidence, str):
                    return field + ".evidence item must be string"
        validation = audit["validation"]
        if not isinstance(validation, dict):
            return "validation must be a dict"
        if validation.get("mechanism") not in ["strict_eq", "run_nondet_unsafe", "prompt_comparative", "prompt_non_comparative", "none"]:
            return "invalid validation mechanism"
        if not isinstance(validation.get("properly_used"), bool):
            return "validation.properly_used must be bool"
        if not isinstance(validation.get("evidence"), list):
            return "validation.evidence must be list"
        for evidence in validation["evidence"]:
            if not isinstance(evidence, str):
                return "validation.evidence item must be string"
        if not isinstance(validation.get("explanation"), str):
            return "validation.explanation must be string"
        if not isinstance(audit["recommendations"], list):
            return "recommendations must be list"
        for recommendation in audit["recommendations"]:
            if not isinstance(recommendation, str):
                return "recommendation item must be string"
        return ""

    def _audit_shape_is_valid(self, audit: dict) -> bool:
        return self._audit_shape_error(audit) == ""

    @gl.public.write
    def audit_contract(self, contract_code: str) -> str:
        if contract_code.strip() == "":
            raise gl.vm.UserError("Contract code is required.")
        audit_id = str(self.audit_count)
        owner = str(gl.message.sender_address)

        def leader_fn():
            standard_response = gl.nondet.web.get(SOOTHMARK_STANDARD_URL)
            verification_standard = standard_response.body.decode("utf-8")

            if (
                "SoothMark Verification Standard" not in verification_standard
                or "classification" not in verification_standard
                or "validation" not in verification_standard
            ):
                verification_standard = "SoothMark Verification Standard unavailable or invalid."

            prompt = f"""
You are the Soothmark leader.
You are auditing the full submitted GenLayer contract code. Soothmark audits only this path: intent -> nondeterminism -> state impact -> validation/equivalence. Do not perform a broad smart-contract audit. The full submitted contract code is the source of truth. You must read and reason over it directly.
Public SoothMark Verification Standard:
{verification_standard}
Use this public standard as the source of truth for scope, classifications, validation mechanism meanings, important rules, audit schema, and recommendations.

Additional operational guidance:
- Intent means explaining what the submitted contract is trying to do based on its class name, storage fields, public methods, and main write flow. The `intent` field must describe the submitted contract's actual purpose and main state-changing behavior, not the fact that SoothMark is auditing it. Avoid generic intent such as "audit the full submitted contract code" or "audits submitted GenLayer contracts" unless the submitted contract itself is an audit contract. When the submitted contract is SoothMark or another audit contract, the intent must still be specific: mention what kind of contracts it audits, what safety path it checks, what standard or criteria it uses if visible, and what state it stores. For SoothMark, prefer intent like: "Audits submitted GenLayer Intelligent Contracts against the public SoothMark Verification Standard for nondeterministic data usage, state impact, and validation/equivalence safety, then stores wallet-scoped audit results on-chain."
- Reasoning order: first identify contract intent, then identify executable nondeterministic calls, then ignore random mentions in strings/comments/prompts/schemas/docs/detector lists, then decide whether nondeterministic output can affect saved state, then identify executable validation/equivalence mechanisms, then decide whether the mechanism protects the nondeterministic state-changing path, then choose classification.
- If the submitted code is clearly incomplete, too short, or lacks a class extending `gl.Contract`, classify the audit as conditional and recommend submitting the full contract. Do not say "provided code snippet" unless the submitted code is actually incomplete.
- A GenLayer method counts only if it is actually used in executable contract logic.
- Ignore mentions of GenLayer methods inside strings, comments, prompt instructions, schema examples, detector pattern lists, documentation text, recommendations, or JSON examples.
- Nested functions, closures, callbacks, helper functions, and inner functions count as executable logic when they are called directly or passed into executable GenLayer mechanisms.
- If `leader_fn` or `validator_fn` is passed into `gl.vm.run_nondet_unsafe`, the body of that function is executable contract logic.
- If executable code calls `gl.nondet.exec_prompt`, `gl.nondet.web.get`, `gl.nondet.web.request`, or `gl.nondet.web.render`, then nondeterminism is present.
- `state_impact.present` must be true only when executable nondeterministic output can affect saved contract state.
- Do not mark state impact true merely because the contract writes to `self.*` or `TreeMap`; the write must be connected to nondeterministic output.
- For deterministic contracts that only store user-provided method arguments or deterministic calculations, nondeterminism.present must be false and state_impact.present must be false, even if the contract updates state.
- For deterministic contracts, validation/equivalence is not required. Use validation.mechanism = "none" and validation.properly_used = true.
- `response_format` is not validation. It only structures model output and does not prove equivalence or validator safety.
- If a contract stores `gl.nondet.exec_prompt` output and relies only on `response_format`, validation.mechanism must be "none" and validation.properly_used must be false.
- If the nondeterministic path is wrapped by `gl.vm.run_nondet_unsafe`, then validation.mechanism should usually be "run_nondet_unsafe", not "none".
- `run_nondet_unsafe` with a substantive validator can be certified.
- `run_nondet_unsafe` with a lightweight shape/schema/classification/score-range validator should usually be conditional, not rejected.
- A validator that only checks score is within 0-100 is lightweight and should not be treated as substantive equivalence validation.
- A validator that only checks JSON structure, result shape, schema fields, classification field validity, allowed classification values, malformed outputs, or score ranges is lightweight validation only.
- Do not call shape/schema/classification checking "meaningful validation" or "substantive equivalence validation."
- If `run_nondet_unsafe` wraps nondeterministic output but the validator only checks JSON structure, shape, schema, classification validity, allowed values, malformed output, or score range, classify the audit as `conditional`, not `certified`.
- For `run_nondet_unsafe` to be certified, the validator must substantively check the leader result against the submitted contract, a deterministic invariant, the public SoothMark Verification Standard, or an independently derived equivalent result.
- If the validator does not check the correctness of evidence, reasoning, state-impact analysis, or alignment with the submitted contract and standard, then validation.properly_used must be false.
- If the classification is conditional because validation exists but is weak, lightweight, shape-only, schema-only, classification-only, score-range-only, unclear, or incomplete, then validation.properly_used must be false.
- `run_nondet_unsafe` with no meaningful validator or a validator unrelated to the stored result can be rejected.
- Do not reject a contract merely because `validator_fn` contains nondeterministic GenLayer calls. Validators may independently run nondeterministic logic to check equivalence.
- Classify as certified only if validation clearly protects the nondeterministic state-changing path.
- Classify as conditional if validation exists but its coverage, strictness, semantic quality, or correctness is unclear or incomplete.
- Classify as rejected only if nondeterministic output can affect state and no meaningful validation/equivalence mechanism is visible, or if the visible mechanism clearly does not check the state-changing nondeterministic path.
- Do not recommend adding `run_nondet_unsafe` if the contract already actually wraps the nondeterministic result in `gl.vm.run_nondet_unsafe`; instead recommend strengthening the validator.

If the Public SoothMark Verification Standard is unavailable or invalid, classify the audit as conditional and explain that the public standard was unavailable or unverifiable.
Do not audit dependency style, storage architecture, public method completeness, frontend completeness, general error handling, indexing, pagination, dispute flow, unrelated GenLayer methods, or general smart-contract security.
Return only JSON using exactly this schema: {{"classification":"certified|conditional|rejected","intent":"string","nondeterminism":{{"present":true,"evidence":["string"]}},"state_impact":{{"present":true,"evidence":["string"]}},"validation":{{"mechanism":"strict_eq|run_nondet_unsafe|prompt_comparative|prompt_non_comparative|none","properly_used":true,"evidence":["string"],"explanation":"string"}},"recommendations":["string"]}}.
Boolean fields must use only JSON true or false. Never use strings such as "true", "false", "yes", "no", "present", "absent", or "unknown".
Evidence must quote or name actual executable code lines from the submitted contract when possible. Evidence should not quote random strings or prompt instructions unless explaining that they are not executable usage.

Full Submitted Contract:
{contract_code}
"""
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            result = self._repair_audit_shape(result)
            shape_error = self._audit_shape_error(result)
            if shape_error != "":
                raise gl.vm.UserError("Soothmark audit returned an invalid shape: " + shape_error)
            return result

        def validator_fn(leader_result):
            # This validator is intentionally minimal to avoid validator timeout. The leader performs audit reasoning; validators only reject malformed results or invalid classifications.
            if hasattr(leader_result, "calldata"):
                leader_result = leader_result.calldata
            if isinstance(leader_result, str):
                try:
                    leader_result = json.loads(leader_result)
                except Exception:
                    return False
            if not isinstance(leader_result, dict):
                return False
            return leader_result.get("classification") in ["certified", "conditional", "rejected"]

        audit = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        if isinstance(audit, dict):
            stored_audit = audit
        elif hasattr(audit, "calldata"):
            stored_audit = audit.calldata
        else:
            stored_audit = str(audit)
        if isinstance(stored_audit, dict):
            self.audits[audit_id] = json.dumps(stored_audit, sort_keys=True)
        else:
            self.audits[audit_id] = json.dumps(stored_audit)
        self.audit_owners[audit_id] = owner
        existing_user_audits = self.user_audits.get(owner, "[]")
        try:
            user_audit_ids = json.loads(existing_user_audits)
            if not isinstance(user_audit_ids, list):
                user_audit_ids = []
        except Exception:
            user_audit_ids = []
        user_audit_ids.append(audit_id)
        self.user_audits[owner] = json.dumps(user_audit_ids)
        self.last_audit_id = audit_id
        self.audit_count = self.audit_count + u256(1)
        return audit_id

    @gl.public.view
    def get_audit(self, audit_id: str) -> str:
        return self.audits.get(audit_id, "")

    @gl.public.view
    def get_audit_count(self) -> str:
        return str(self.audit_count)

    @gl.public.view
    def get_last_audit_id(self) -> str:
        return self.last_audit_id

    @gl.public.view
    def get_last_audit(self) -> str:
        if self.last_audit_id == "":
            return ""
        return self.audits.get(self.last_audit_id, "")

    @gl.public.view
    def get_audit_owner(self, audit_id: str) -> str:
        return self.audit_owners.get(audit_id, "")

    @gl.public.view
    def get_audit_ids_by_owner(self, owner: str) -> str:
        return self.user_audits.get(owner, "[]")

    @gl.public.view
    def get_my_audit_ids(self) -> str:
        owner = str(gl.message.sender_address)
        return self.user_audits.get(owner, "[]")
