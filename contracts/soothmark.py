# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json


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
        for field in ["nondeterminism", "state_impact"]:
            value = self._coerce_bool(audit[field].get("present"))
            if value is not None:
                audit[field]["present"] = value
            evidence = audit[field].get("evidence", [])
            audit[field]["evidence"] = [str(item) for item in evidence] if isinstance(evidence, list) else []
        value = self._coerce_bool(audit["validation"].get("properly_used"))
        if value is not None:
            audit["validation"]["properly_used"] = value
        mechanism = audit["validation"].get("mechanism", "none")
        if isinstance(mechanism, str):
            mechanism = mechanism.strip().lower()
        if mechanism not in ["strict_eq", "run_nondet_unsafe", "prompt_comparative", "prompt_non_comparative", "response_format", "none"]:
            mechanism = "none"
        audit["validation"]["mechanism"] = mechanism
        evidence = audit["validation"].get("evidence", [])
        audit["validation"]["evidence"] = [str(item) for item in evidence] if isinstance(evidence, list) else []
        if not isinstance(audit.get("intent"), str):
            audit["intent"] = str(audit.get("intent", ""))
        if not isinstance(audit["validation"].get("explanation"), str):
            audit["validation"]["explanation"] = str(audit["validation"].get("explanation", ""))
        recommendations = audit.get("recommendations", [])
        audit["recommendations"] = [str(item) for item in recommendations if str(item) != ""] if isinstance(recommendations, list) else []
        if isinstance(audit.get("classification"), str):
            audit["classification"] = audit["classification"].strip().lower()
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
        if validation.get("mechanism") not in ["strict_eq", "run_nondet_unsafe", "prompt_comparative", "prompt_non_comparative", "response_format", "none"]:
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
            prompt = f"""
You are the Soothmark leader.
You are auditing the full submitted GenLayer contract code. Soothmark audits only this path: intent -> nondeterminism -> state impact -> validation/equivalence. Do not perform a broad smart-contract audit. The full submitted contract code is the source of truth. You must read and reason over it directly.
Important execution rule: A GenLayer method counts only if it is actually used in executable contract logic. Do not count methods that appear only inside string literals, comments, prompt instructions, schema examples, detector pattern lists, documentation text, recommendations, or JSON examples. Examples that are not executable usage: "gl.vm.run_nondet_unsafe" inside a prompt string; ("gl.nondet.web.get", ["web access"]) inside a detector pattern list; comments saying "# use strict_eq here"; schema text mentioning "response_format"; recommendations mentioning "wrap in run_nondet_unsafe". Examples that are executable usage: docs_response = gl.nondet.web.get(docs_url); result = gl.nondet.exec_prompt(prompt, response_format="json"); audit = gl.vm.run_nondet_unsafe(leader_fn, validator_fn); value = gl.eq_principle.strict_eq(fetch_result); self.audits[audit_id] = json.dumps(stored_audit); self.last_audit_id = audit_id; self.audit_count = self.audit_count + u256(1).
Executable contract logic includes nested functions, closures, callbacks, helper functions, and inner functions when they are called directly or passed into executable GenLayer mechanisms. In particular, if a function such as `leader_fn` or `validator_fn` is passed to `gl.vm.run_nondet_unsafe`, then the body of that function is executable contract logic. Any `gl.nondet.exec_prompt`, `gl.nondet.web.get`, `gl.nondet.web.request`, or `gl.nondet.web.render` call inside that function counts as executable nondeterminism. Do not classify nondeterminism as absent if such calls exist inside nested functions used by `run_nondet_unsafe`.
Hardcoded Soothmark rulebook: Intent means explaining what the contract is trying to do based on class name, storage, public methods, and main write flow. Nondeterminism means executable logic that may produce different results across validators, including gl.nondet.web.get, gl.nondet.web.request, gl.nondet.web.render, gl.nondet.exec_prompt, AI-generated outputs, web-fetched content, rendered external pages, or other external/unpredictable inputs. State impact means nondeterministic output can affect persistent contract memory, including self.* fields, TreeMap writes, counters, stored results, status fields, audit storage, or any value remembered after the transaction. State impact does not mean every state write. It only matters when the value being stored comes from, depends on, or follows executable nondeterministic logic. Validation/equivalence means GenLayer mechanisms that make nondeterministic state-changing logic acceptable across validators: gl.eq_principle.strict_eq, gl.vm.run_nondet_unsafe, prompt_comparative, prompt_non_comparative, response_format. response_format is structured-output support and may not be enough by itself for every nondeterministic state update. Do not judge validation/equivalence by mechanism name alone. A known mechanism is properly used only if it protects the same nondeterministic value that can affect persistent contract state. The audit must trace the path: intent -> nondeterminism -> state impact -> validation/equivalence. Decide whether the validation mechanism covers that exact path.
Mechanism-specific guidance: `gl.vm.run_nondet_unsafe` can be appropriate when the leader and validator functions protect the nondeterministic result before it is stored. It is conditional or improper if the validator does not actually check the state-changing result. `gl.eq_principle.strict_eq` can be appropriate when exact equality is required for the nondeterministic value before storage. `prompt_comparative` can be appropriate when semantic equivalence is acceptable for the stored value and the equivalence rule is tight enough. Do not reject merely because the mechanism is `prompt_comparative`. Reject or mark conditional only if the comparative rule is too loose, unrelated to the stored state, or allows materially different stored values to count as equivalent. `prompt_non_comparative` can be appropriate when the output is checked against clear requirements before it affects state. It is conditional or improper if the requirements are vague or do not cover the stored value. `response_format` is structured-output support. It helps shape AI output, but by itself may not be enough to validate nondeterministic state-changing logic.
Reasoning order: 1. Identify contract intent. 2. Identify executable nondeterministic calls. 3. Ignore random mentions in strings, comments, prompts, schemas, docs, and detector lists. 4. Decide whether nondeterministic output can affect saved state. 5. Identify executable validation/equivalence mechanisms. 6. Decide whether the mechanism protects the nondeterministic state-changing path. 7. Choose classification.
Important rules: Do not say nondeterminism is present just because code mentions gl.nondet.* inside strings, comments, prompt text, schema text, or detector pattern lists. Do not say validation exists just because code mentions run_nondet_unsafe, strict_eq, prompt_comparative, prompt_non_comparative, or response_format inside strings, comments, prompt text, schema text, or detector pattern lists. Do not say nondeterminism is absent if executable code actually calls gl.nondet.web.get, gl.nondet.web.request, gl.nondet.web.render, or gl.nondet.exec_prompt. Do not say validation/equivalence is absent if executable code actually calls gl.vm.run_nondet_unsafe, gl.eq_principle.strict_eq, prompt_comparative, prompt_non_comparative, or uses response_format as an executable exec_prompt argument. state_impact.present must be true only when output from executable nondeterministic logic can affect saved contract state. Do not set state_impact.present to true merely because the contract writes to self.* or TreeMap. State writes matter only when they are connected to nondeterministic output such as web data, rendered pages, AI output, or other external unpredictable input. For deterministic contracts that only store user-provided method arguments or deterministic calculations, nondeterminism.present must be false and state_impact.present must be false, even if the contract updates self.* fields. For deterministic contracts, validation/equivalence is not required. In that case validation.mechanism should be none and validation.properly_used should be true. If state writes exist but they are deterministic, mention them only in the intent or explanation. Do not use deterministic state writes as evidence that nondeterministic state impact is present. Do not recommend adding run_nondet_unsafe if the contract already actually wraps the nondeterministic result in gl.vm.run_nondet_unsafe. If gl.nondet.exec_prompt runs inside leader_fn and the final result is returned through gl.vm.run_nondet_unsafe before storage, explain whether run_nondet_unsafe protects the nondeterministic audit result before state update. If the contract only detects text patterns like "gl.nondet.web.get" but does not actually execute gl.nondet.web.get, do not treat that detector logic as web nondeterminism.
Do not reject a contract merely because `validator_fn` contains `gl.nondet.exec_prompt`, `gl.nondet.web.get`, `gl.nondet.web.request`, or `gl.nondet.web.render`. In GenLayer custom equivalence patterns, validators may independently run nondeterministic logic to check whether the leader result is supported or equivalent. Nondeterminism inside a validator function is not automatically invalid. The important question is whether `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` is used to compare or validate the leader’s nondeterministic result before state is updated.
Mandatory nondeterminism check before returning JSON: scan the full submitted contract for executable calls to `gl.nondet.exec_prompt`, `gl.nondet.web.get`, `gl.nondet.web.request`, and `gl.nondet.web.render`, including inside nested functions passed to `gl.vm.run_nondet_unsafe`. If any such executable call exists, `nondeterminism.present` must be true. If the nondeterministic result can affect stored contract state after `run_nondet_unsafe`, `state_impact.present` must be true. If the path is wrapped by `gl.vm.run_nondet_unsafe`, then `validation.mechanism` must be `run_nondet_unsafe`, not `none`.
For contracts using `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`, do not classify as rejected solely because the validator uses nondeterministic GenLayer calls. Classify as `certified` if the validator clearly checks the leader result against the submitted contract or an equivalent independently derived result. Classify as `conditional` if the validator exists but its coverage, strictness, or quality is unclear. Classify as `rejected` only if nondeterministic output affects state and there is no appropriate validation/equivalence mechanism, or if the visible validation mechanism clearly does not check the nondeterministic state-changing path at all.
Classification rules: certified = no executable nondeterminism, or no nondeterministic output can affect state, or nondeterministic state impact is properly protected by an appropriate validation/equivalence mechanism. conditional = nondeterministic state impact exists and validation exists, but coverage, validator quality, or correctness is unclear or incomplete. rejected = nondeterministic output can affect state and no appropriate validation/equivalence mechanism is visible. Classification must be based on whether the chosen mechanism properly protects the nondeterministic state-impacting path, not on preferring one mechanism globally. `run_nondet_unsafe`, `strict_eq`, `prompt_comparative`, `prompt_non_comparative`, and `response_format` should each be evaluated in context. If the submitted code is clearly incomplete, too short, or lacks a class extending gl.Contract, classify conditional and recommend submitting the full contract. Do not say "provided code snippet" unless the submitted code is actually incomplete.
Do not audit dependency style, storage architecture, public method completeness, frontend completeness, general error handling, indexing, pagination, dispute flow, unrelated GenLayer methods, or general smart-contract security.
Return only JSON using exactly this schema: {{"classification":"certified|conditional|rejected","intent":"string","nondeterminism":{{"present":true,"evidence":["string"]}},"state_impact":{{"present":true,"evidence":["string"]}},"validation":{{"mechanism":"strict_eq|run_nondet_unsafe|prompt_comparative|prompt_non_comparative|response_format|none","properly_used":true,"evidence":["string"],"explanation":"string"}},"recommendations":["string"]}}.
Boolean fields must be real JSON booleans, not strings: nondeterminism.present, state_impact.present, validation.properly_used.
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
            if isinstance(leader_result, dict):
                proposed_audit = leader_result
            elif hasattr(leader_result, "calldata"):
                proposed_audit = leader_result.calldata
            else:
                return False
            proposed_audit = self._repair_audit_shape(proposed_audit)
            if not self._audit_shape_is_valid(proposed_audit):
                return False
            validation_prompt = f"""
You are a Soothmark validator. Do not perform a new audit. Do not improve the leader answer. Do not require exact wording. Decide only whether the proposed audit is reasonably supported by the full submitted contract code. Check only: 1. intent 2. nondeterminism 3. state impact 4. validation/equivalence. A GenLayer method counts only if it appears in executable code, not merely inside strings, comments, prompt text, schemas, detector lists, documentation text, or recommendations. Nested functions passed to `gl.vm.run_nondet_unsafe` are executable contract logic. If the submitted contract contains `gl.nondet.exec_prompt`, `gl.nondet.web.get`, `gl.nondet.web.request`, or `gl.nondet.web.render` inside `leader_fn`, `validator_fn`, or another nested function used by `run_nondet_unsafe`, then a proposed audit claiming `nondeterminism.present=false` is clearly contradicted and must return `supported=false`. If the submitted contract wraps that nondeterministic path with `gl.vm.run_nondet_unsafe`, then a proposed audit claiming `validation.mechanism="none"` is clearly contradicted and must return `supported=false`. Do not return `supported=false` merely because the proposed audit treats nondeterministic calls inside `validator_fn` as part of a valid `run_nondet_unsafe` equivalence pattern. In GenLayer, validator functions may independently use nondeterministic calls to evaluate whether the leader result is supported or equivalent. Do not return `supported=false` merely because the proposed audit accepts `prompt_comparative`, `prompt_non_comparative`, `strict_eq`, or `run_nondet_unsafe` as a valid mechanism. These mechanisms may be valid when they protect the exact nondeterministic value that affects state. Return `supported=false` only if the proposed audit is clearly contradicted by the submitted contract code, such as claiming a mechanism protects the state-changing path when it is only mentioned in comments/strings, applied to the wrong value, or has an equivalence rule that visibly allows materially different stored state to count as equivalent. A proposed audit is clearly contradicted if it says `validation.mechanism="none"` when `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` is visibly used, or if it says there is no nondeterminism when executable `gl.nondet.*` calls are visible. state_impact.present means nondeterministic output affects saved state. Do not disagree merely because the contract has deterministic state writes. For deterministic contracts with no executable nondeterministic calls, a certified audit with validation.mechanism='none' and validation.properly_used=true is supported. Return supported=true if the leader certifies a deterministic contract because validation/equivalence is not required. Return supported=false only if the proposed audit is clearly contradicted by the submitted contract code. Return supported=true for uncertainty, minor omissions, different wording, imperfect recommendations, and non-MVP issues. If unsure, return supported=true. Return JSON only: {{"supported": true}} or {{"supported": false}}.

Full Submitted Contract:
{contract_code}

Proposed audit:
{json.dumps(proposed_audit, sort_keys=True)}
"""
            verdict = gl.nondet.exec_prompt(validation_prompt, response_format="json")
            return isinstance(verdict, dict) and verdict.get("supported") is True

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
