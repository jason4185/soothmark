import type { AuditClassification } from "@/types/audit";

export type ExampleContract = {
  id: string;
  name: string;
  description: string;
  expectedClassification: AuditClassification;
  expectedLabel?: string;
  code: string;
};

export const exampleContracts: ExampleContract[] = [
  {
    id: "simple-storage",
    name: "SimpleStorage",
    description: "Deterministic state updates with no nondeterministic state impact.",
    expectedClassification: "certified",
    expectedLabel: "Certified",
    code: `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class SimpleStorage(gl.Contract):
    message: str
    update_count: u256

    def __init__(self):
        self.message = ""
        self.update_count = u256(0)

    @gl.public.write
    def set_message(self, new_message: str) -> None:
        self.message = new_message
        self.update_count = self.update_count + u256(1)

    @gl.public.view
    def get_message(self) -> str:
        return self.message

    @gl.public.view
    def get_update_count(self) -> str:
        return str(self.update_count)`,
  },
  {
    id: "bad-web-fetcher",
    name: "BadWebFetcher",
    description: "Stores external web output without validation or equivalence protection.",
    expectedClassification: "rejected",
    expectedLabel: "Rejected",
    code: `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class BadWebFetcher(gl.Contract):
    last_price: str

    def __init__(self):
        self.last_price = ""

    @gl.public.write
    def fetch_price(self) -> None:
        response = gl.nondet.web.get("https://api.example.com/price")
        price = response.body.decode("utf-8")
        self.last_price = price

    @gl.public.view
    def get_last_price(self) -> str:
        return self.last_price`,
  },
  {
    id: "fake-validation-mention",
    name: "FakeValidationMention",
    description: "Mentions validation in comments or strings but never executes the mechanism.",
    expectedClassification: "rejected",
    expectedLabel: "Rejected",
    code: `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class FakeValidationMention(gl.Contract):
    saved_result: str

    def __init__(self):
        self.saved_result = ""

    @gl.public.write
    def fetch_and_store(self) -> None:
        # TODO: maybe use gl.vm.run_nondet_unsafe here later
        note = "This contract should use gl.vm.run_nondet_unsafe or gl.eq_principle.strict_eq"
        schema_hint = '{"response_format": "json", "mechanism": "run_nondet_unsafe"}'

        response = gl.nondet.web.get("https://api.example.com/status")
        result = response.body.decode("utf-8")

        self.saved_result = result + " | " + note + " | " + schema_hint

    @gl.public.view
    def get_saved_result(self) -> str:
        return self.saved_result`,
  },
  {
    id: "safe-web-fetcher",
    name: "SafeWebFetcher",
    description: "Protects a nondeterministic web result before it is saved to contract state.",
    expectedClassification: "certified",
    expectedLabel: "Certified",
    code: `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class SafeWebFetcher(gl.Contract):
    last_price: str

    def __init__(self):
        self.last_price = ""

    @gl.public.write
    def fetch_price(self) -> None:
        def leader_fn():
            response = gl.nondet.web.get("https://api.example.com/price")
            return response.body.decode("utf-8")

        def validator_fn(leader_result):
            response = gl.nondet.web.get("https://api.example.com/price")
            validator_result = response.body.decode("utf-8")
            return validator_result == leader_result

        price = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.last_price = price

    @gl.public.view
    def get_last_price(self) -> str:
        return self.last_price`,
  },
];

export function getExampleById(exampleId: string) {
  return exampleContracts.find((example) => example.id === exampleId);
}
