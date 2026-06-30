# Soothmark

Soothmark is a GenLayer-native intelligent contract auditor that checks whether contract code uses the right validation/equivalence mechanism before AI, web data, API results, or rendered page content can affect on-chain contract data.

Soothmark helps GenLayer builders check if AI or fetched web data is properly validated before it changes what their contract stores.

Soothmark traces one critical path: intent → nondeterminism → state impact → validation/equivalence → result.

SoothMark follows the public SoothMark Verification Standard.

---

## Live Demo

- App: [https://soothmark.xyz](https://soothmark.xyz)
- Network: GenLayer Bradbury testnet
- Current deployed SoothMark contract:
  `0x0e69f0897Ce7B49F33B2A2bb510B0774DD3DdA57`
- Public standard:
  [https://soothmark-verification-standard.netlify.app/standard.json](https://soothmark-verification-standard.netlify.app/standard.json)

Soothmark is live as a Bradbury testnet demo. The app reads and writes audit results through the deployed GenLayer intelligent contract, lets users submit GenLayer contract code for audit, and reads structured audit reports back from GenLayer contract state.

## What Soothmark Checks

Soothmark follows the public SoothMark Verification Standard:

1. What is the contract trying to do?
2. Does it use AI or fetched web data?
3. Can that result change what the contract stores?
4. Does the contract use the right validation/equivalence mechanism?
5. Does that mechanism protect the exact data path that changes contract data?

The standard is public and contract-neutral so the audit criteria can be reviewed independently of any deployed contract address.

Soothmark does not treat formatting as validation. For example, `response_format` can structure an AI response, but it does not prove the result was validated.

The result is one of three classifications:

- **Certified** — no risky nondeterministic state path was found, or the path is properly protected.
- **Conditional** — validation exists, but the coverage is unclear or incomplete.
- **Rejected** — AI or fetched web data can affect contract storage without the right validation/equivalence mechanism.

### How the Live Flow Works

Live workflow:

1. A user connects a wallet.
2. The user submits GenLayer contract code for audit.
3. The SoothMark Intelligent Contract fetches the public SoothMark Verification Standard.
4. The leader audits the submitted code against that standard.
5. The result is repaired/shape-checked, lightly validated, and stored in contract state.
6. The frontend reads the report and wallet-scoped dashboard data back from GenLayer.

The current testnet release keeps validator checks lightweight to reduce timeout risk, while the leader performs the full Soothmark audit reasoning.

---

## The Vision

As a developer building on GenLayer, I saw that intelligent contracts introduce a new kind of risk.

Traditional smart contract review is not enough on its own, because GenLayer contracts can use web data, AI output, rendered pages, and other nondeterministic inputs. The hard question is not only "does this code run?" It is also "can this AI or fetched web data change on-chain contract data without the right validation or equivalence check?"

From my own developer experience, and from conversations with other builders working around GenLayer, it became clear that people needed a focused tool for this exact problem.

Soothmark was built to make this review visible, structured, and repeatable.

To make SoothMark transparent, the audit criteria were moved into a public contract-neutral SoothMark Verification Standard. The contract fetches this standard during audit execution, so builders and judges can inspect the criteria being applied.

---

## What Soothmark Is

Soothmark is a focused auditor for GenLayer intelligent contracts. It turns the audit path into a structured report that is easy to inspect, compare, and revisit later.

```text
Intent -> Nondeterminism -> State Impact -> Validation/Equivalence Check -> Result
```

- **Intent:** What the contract is trying to do.
- **Nondeterminism:** Whether the contract uses AI, web, render, or other unpredictable external inputs.
- **State Impact:** Whether that nondeterministic output can affect on-chain contract data.
- **Validation/Equivalence Check:** Whether the correct GenLayer validation/equivalence mechanism protects that path.
- **Result:** Certified, Conditional, or Rejected.

---

## Current App Status

Soothmark is live at [soothmark.xyz](https://soothmark.xyz) with a working end-to-end Bradbury testnet audit flow: a user can connect a wallet, submit a GenLayer contract, wait for the accepted transaction flow, open the structured report, and review wallet-scoped audit history from the dashboard.

Current working pieces include:

- live deployed app
- frontend audit workspace with README screenshots
- wallet connection
- public SoothMark Verification Standard
- contract-neutral `standard.json`
- real GenLayer contract interaction
- compact leader prompt that fetches the public standard
- GenLayer contract submission flow and accepted transaction handling
- polling for stored audit reports
- full audit report page
- wallet-scoped dashboard with owner-indexed reads
- wallet-scoped audit ownership
- owner-indexed audit history
- deployed Bradbury testnet contract address: `0x0e69f0897Ce7B49F33B2A2bb510B0774DD3DdA57`
- examples page
- production build and lint checks
- Vercel-ready deployment configuration

Soothmark is still early, but the core audit path is in place.

---

## What It Does

Soothmark lets a user paste or load a GenLayer contract, submit it for an on-chain audit, and receive a structured audit report.

The report shows:

- contract intent
- nondeterministic behavior
- whether nondeterminism affects state
- whether validation/equivalence is properly used
- recommendations
- raw audit JSON for technical inspection

---

## Key Innovations

### 1. Validation/Equivalence Focus

Soothmark focuses on the GenLayer-specific question of whether nondeterministic state-changing paths are protected by the right validation/equivalence mechanism.

### 2. GenLayer-Native Audit Path

The audit mirrors the actual GenLayer risk path rather than producing a generic code review.

### 3. Public Verification Standard

SoothMark uses a public, contract-neutral standard hosted as JSON so audit criteria are reviewable and not hidden inside the app.

### 4. Compact On-Chain Audit Prompt

The latest contract keeps only critical guardrails in the leader prompt and relies on the fetched public standard for detailed operational guidance.

### 5. On-Chain Audit Storage

Audit reports are stored through the Soothmark intelligent contract, making each report tied to an audit ID and wallet owner.

### 6. Wallet-Scoped Dashboard

Users see their own audit history through wallet ownership filtering. The app does not expose a public or global audit history.

### 7. Structured Machine-Readable Reports

Reports use a compact JSON schema so results can be read by both humans and tools.

### 8. Focused Certification Language

Soothmark avoids fake broad scores and instead returns Certified, Conditional, or Rejected based on the exact validation/equivalence path.

---

## Technical Pillars

### GenLayer Intelligent Contract Backend

The Soothmark backend is an intelligent contract that receives submitted contract code, fetches the public SoothMark Verification Standard with `gl.nondet.web.get`, applies the standard in `gl.nondet.exec_prompt`, and stores structured audit JSON on-chain.

### Leader and Validator Review

Audit reasoning runs through GenLayer's leader/validator model using nondeterministic execution and validator agreement. The leader performs full audit reasoning. The validator is intentionally lightweight for the current Bradbury testnet release, and repair logic normalizes malformed booleans and weak validator classifications.

### Public SoothMark Verification Standard

SoothMark's audit criteria are hosted publicly at `https://soothmark-verification-standard.netlify.app/standard.json`. The standard includes scope, classifications, validation mechanism meanings, operational guidance, important rules, and the audit schema. The Intelligent Contract fetches this standard during audit execution and uses it as the source of truth for the leader's audit reasoning.

### Minimal, Focused Schema

Reports use a small schema built around:

- `classification`
- `intent`
- `nondeterminism`
- `state_impact`
- `validation`
- `recommendations`

### Frontend Audit Workspace

The frontend is built with:

- Next.js
- TypeScript
- Tailwind
- wallet connection
- GenLayer client adapter
- dashboard and report pages

### Wallet-Scoped Audit Retrieval

Soothmark stores audit reports by audit ID and also tracks audit IDs by owner wallet. The dashboard uses this owner index to load a wallet's audit records without scanning the full global audit count.

### Production-Oriented UX

Soothmark uses a light-first Luminous Audit Workspace design with clean audit states, report-first presentation, raw JSON hidden by default, and debug logs controlled by `NEXT_PUBLIC_SOOTHMARK_DEBUG`.

---

## GenLayer Methods Used

### `gl.nondet.web.get`

Used inside the leader path to fetch the public SoothMark Verification Standard from:

[https://soothmark-verification-standard.netlify.app/standard.json](https://soothmark-verification-standard.netlify.app/standard.json)

### `gl.nondet.exec_prompt`

Used by the leader to audit the submitted GenLayer contract against the fetched public standard and return structured JSON.

### `gl.vm.run_nondet_unsafe`

Used to run the audit reasoning path through GenLayer's leader/validator model. The leader proposes the structured audit result. For the current Bradbury testnet release, SoothMark keeps validator checks lightweight to reduce timeout risk, while the leader performs the full audit reasoning.

Soothmark does not use ordinary Python helper logic to decide audit facts. The audit reasoning is intended to happen through GenLayer's nondeterministic execution and validator verification path.

### `gl.message.sender_address`

Used to associate each submitted audit with the wallet address that submitted it. This powers wallet-scoped audit history in the dashboard.

### `TreeMap`

Used for persistent contract storage:

- audit ID -> audit report JSON
- audit ID -> owner address
- owner wallet -> audit ID list

This keeps audit reports retrievable by ID and lets the frontend load dashboard records through wallet-scoped audit indexing.

### `u256`

Used for the audit counter so each submitted audit receives a stable incremental audit ID.

### JSON serialization

Audit reports are stored as JSON strings so the frontend can retrieve, normalize, and render structured reports consistently.

---

## UI Tour

### 1. Landing Page

![Soothmark landing page](./docs/images/landing.png)

The landing page introduces Soothmark's focused audit scope and gives users a clear place to start an audit.

### 2. Audit Workspace

![Soothmark audit workspace](./docs/images/audit-workspace.png)

Users paste or load a GenLayer contract, connect their wallet, and submit the contract for an on-chain audit.

### 3. Audit In Progress

![Soothmark audit progress](./docs/images/audit-progress.png)

After submission, Soothmark tracks the transaction and waits for the audit report to become available from the contract.

### 4. Audit Report

![Soothmark audit report](./docs/images/audit-report.png)

The report shows the audit result, verdict, intent, nondeterminism, state impact, Validation/Equivalence Check, recommendations, and optional raw JSON.

### 5. Dashboard

![Soothmark dashboard](./docs/images/dashboard.png)

The dashboard gives users a wallet-scoped history of their own audits and lets them reopen individual reports.

### 6. Examples

![Soothmark examples page](./docs/images/examples.png)

The examples page gives users focused GenLayer contract samples for testing Soothmark's audit path.

---

## Audit Scope

Soothmark checks:

- executable nondeterministic logic
- nondeterministic state impact
- validation/equivalence coverage
- whether the protection matches the state-changing path

Soothmark does not check:

- general protocol vulnerabilities
- gas optimization
- frontend security
- broad code quality
- full protocol correctness
- every possible business logic bug

---

## Result Types

| Result      | Meaning                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Certified   | The audit found no unsafe nondeterministic state update, or the relevant path is properly protected. |
| Conditional | A validation path exists, but coverage or tightness is unclear.                                      |
| Rejected    | Nondeterministic output can affect on-chain contract data without proper validation/equivalence protection. |

---

## Configuration & Environment Setup

Copy the example environment file for local development:

```bash
cp .env.example .env.local
```

Set only frontend-safe `NEXT_PUBLIC_*` values. Do not commit `.env.local`, and do not add private keys, seed phrases, mnemonics, or backend secrets. Vercel must receive the same public environment variables for deployment.

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS=0x0e69f0897Ce7B49F33B2A2bb510B0774DD3DdA57
NEXT_PUBLIC_SOOTHMARK_CHAIN=testnetBradbury
NEXT_PUBLIC_SOOTHMARK_RPC_ENDPOINT=https://rpc-bradbury.genlayer.com
NEXT_PUBLIC_SOOTHMARK_RECEIPT_STATUS=ACCEPTED
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-bradbury.genlayer.com
NEXT_PUBLIC_SOOTHMARK_USE_MOCKS=false
NEXT_PUBLIC_SOOTHMARK_ENABLE_GLOBAL_AUDIT_SCAN=false
NEXT_PUBLIC_SOOTHMARK_DEBUG=false
```

| Variable                                       | Purpose                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`         | WalletConnect/Reown project ID used by the wallet provider.                   |
| `NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS`       | Deployed Soothmark intelligent contract address.                              |
| `NEXT_PUBLIC_SOOTHMARK_CHAIN`                  | GenLayer chain target, currently `testnetBradbury`.                           |
| `NEXT_PUBLIC_SOOTHMARK_RPC_ENDPOINT`           | RPC endpoint used to communicate with GenLayer.                               |
| `NEXT_PUBLIC_SOOTHMARK_RECEIPT_STATUS`         | Receipt status expected before the frontend treats a transaction as accepted. |
| `NEXT_PUBLIC_GENLAYER_EXPLORER_URL`            | Explorer base URL used to build transaction links.                            |
| `NEXT_PUBLIC_SOOTHMARK_USE_MOCKS`              | Enables/disables mock mode; should be `false` for deployment.                 |
| `NEXT_PUBLIC_SOOTHMARK_ENABLE_GLOBAL_AUDIT_SCAN` | Controls global audit scanning; should remain `false` for wallet-scoped UX. |
| `NEXT_PUBLIC_SOOTHMARK_DEBUG`                  | Enables Soothmark debug logs when set to `true`.                              |

---

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the local app:

```bash
pnpm dev
```

Then add your own public WalletConnect/Reown project ID in `.env.local`.

---

## Deployment

The frontend can be deployed on Vercel from GitHub.

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Choose the repository root as the root directory.
4. Add the required environment variables.
5. Deploy.

When redeploying the frontend, update the Vercel environment variable `NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS` to the latest deployed SoothMark contract address.

Useful verification commands:

```bash
pnpm lint
pnpm build
```

---

## Planned Features

### Shareable Audit Reports

A future version may allow users to generate controlled share links for specific audit reports, making it easier to share audit results with teammates, reviewers, or hackathon judges without adding global discovery.

### Stronger Validator Verification Mode

A future version may add a stricter validator mode that performs deeper equivalence checks while keeping the current public standard and wallet-scoped audit flow.

### Richer Report Metadata

Future reports may include cleaner metadata, stronger contract-size guidance, and better audit comparison examples while keeping the core audit path focused.

---

## Project Status

SoothMark is a current Bradbury testnet release using a public contract-neutral verification standard and a deployed GenLayer Intelligent Contract.

---

## License

License to be added.
