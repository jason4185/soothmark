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
            "score range",
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

        if (
            classification == "rejected"
            and mechanism == "run_nondet_unsafe"
            and has_weak_validator_finding
        ):
            audit["classification"] = "conditional"
            classification = "conditional"
            audit["validation"]["properly_used"] = False

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
You are the SoothMark leader.

Audit only this path:
intent -> nondeterminism -> state impact -> validation/equivalence.

Use the full submitted contract as the source of truth.
Use the fetched public SoothMark Verification Standard as the source of truth for scope, classifications, validation mechanisms, operational guidance, schema, and recommendations.

Do not perform broad smart-contract security review.

Core guardrails:
- `response_format` is not validation.
- State impact exists only when executable nondeterministic output can affect stored state.
- If `gl.vm.run_nondet_unsafe` wraps the nondeterministic state-changing result, use validation.mechanism = "run_nondet_unsafe".
- Strong/substantive validator can be certified.
- Weak validator that only checks shape, schema, classification, allowed values, malformed output, or score range must be conditional, not certified or rejected.
- If weak validation causes conditional classification, set validation.properly_used = false.
- No meaningful validation or unrelated validation for nondeterministic state impact should be rejected.
- Do not recommend adding `run_nondet_unsafe` if it already wraps the result; recommend strengthening the validator instead.

If the public standard is unavailable or invalid, classify conditional and explain.

Return only JSON using exactly this schema:
{{"classification":"certified|conditional|rejected","intent":"string","nondeterminism":{{"present":true,"evidence":["string"]}},"state_impact":{{"present":true,"evidence":["string"]}},"validation":{{"mechanism":"strict_eq|run_nondet_unsafe|prompt_comparative|prompt_non_comparative|none","properly_used":true,"evidence":["string"],"explanation":"string"}},"recommendations":["string"]}}

Boolean fields must be real JSON true/false only.
Evidence should quote or name actual executable code lines where possible.

Public SoothMark Verification Standard:
{verification_standard}

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
