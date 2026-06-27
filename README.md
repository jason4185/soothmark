# Soothmark

Soothmark is a GenLayer-native intelligent contract auditor that checks whether nondeterministic logic can safely affect saved contract state.

Certify whether GenLayer intelligent contracts safely validate nondeterministic logic before it changes state.

---

## Live Demo

Live demo: _coming soon_

---

## The Vision

As a developer building on GenLayer, I saw that intelligent contracts introduce a new kind of risk.

Traditional smart contract review is not enough on its own, because GenLayer contracts can use web data, AI output, rendered pages, and other nondeterministic inputs. The hard question is not only "does this code run?" It is also "can this nondeterministic result safely change saved state?"

From my own developer experience, and from conversations with other builders working around GenLayer, it became clear that people needed a focused tool for this exact problem.

Soothmark was built to make this review visible, structured, and repeatable.

---

## What Soothmark Is

Soothmark is a focused auditor for GenLayer intelligent contracts.

It follows one critical path:

```text
Intent -> Nondeterminism -> State Impact -> Verification Check -> Result
```

- **Intent:** What the contract is trying to do.
- **Nondeterminism:** Whether the contract uses AI, web, render, or other unpredictable external inputs.
- **State Impact:** Whether that nondeterministic output can affect saved or persistent state.
- **Verification Check:** Whether the correct GenLayer validation/equivalence mechanism protects that path.
- **Result:** Certified, Conditional, or Rejected.

---

## Current App Status

Soothmark currently has a working end-to-end audit flow: a user can connect a wallet, submit a GenLayer contract, wait for the on-chain audit result, open the structured report, and review wallet-scoped audit history from the dashboard.

Current working pieces include:

- frontend audit workspace
- wallet connection
- GenLayer contract submission flow
- polling for stored audit reports
- full audit report page
- wallet-scoped dashboard
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

Result meanings:

- **Certified:** No unsafe nondeterministic state update was found, or the state-changing nondeterministic path is properly protected.
- **Conditional:** A validation path exists, but the audit found ambiguity or incomplete certainty.
- **Rejected:** Nondeterministic output can affect saved state without visible proper validation/equivalence protection.

---

## Key Innovations

### 1. Nondeterministic State-Safety Focus

Soothmark is not a broad scanner. It focuses on one GenLayer-specific safety question:

Can nondeterministic logic safely affect saved state?

### 2. GenLayer-Native Audit Path

The audit mirrors the actual GenLayer risk path:

```text
Intent -> Nondeterminism -> State Impact -> Verification Check -> Result
```

### 3. On-Chain Audit Storage

Audit reports are stored through the Soothmark intelligent contract, making each report tied to an audit ID and wallet owner.

### 4. Wallet-Scoped Dashboard

Users see their own audit history through wallet ownership filtering, without presenting the app as a public audit explorer.

### 5. Structured Machine-Readable Reports

Reports use a compact JSON schema so results can be read by both humans and tools.

### 6. Focused Certification Language

Soothmark avoids fake broad scores and instead returns Certified, Conditional, or Rejected based on the exact nondeterministic state-safety path.

---

## Technical Pillars

### GenLayer Intelligent Contract Backend

The Soothmark backend is an intelligent contract that receives submitted contract code and produces a structured audit result.

### Leader and Validator Review

Audit reasoning runs through GenLayer's leader/validator model using nondeterministic execution and validator agreement.

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

The dashboard reads audit ownership and loads only audit records associated with the connected wallet.

### Production-Oriented UX

Soothmark uses a light-first Luminous Audit Workspace design with clean audit states, report-first presentation, raw JSON hidden by default, and debug logs controlled by `NEXT_PUBLIC_SOOTHMARK_DEBUG`.

---

## GenLayer Methods Used

### `gl.vm.run_nondet_unsafe`

Used to run the audit reasoning path through GenLayer's leader/validator model. The leader proposes the structured audit result, and validators check whether the result is supported by the submitted contract and the Soothmark rulebook.

Soothmark does not use ordinary Python helper logic to decide audit facts. The audit reasoning is intended to happen through GenLayer's nondeterministic execution and validator verification path.

### `gl.message.sender_address`

Used to associate each submitted audit with the wallet address that submitted it. This powers wallet-scoped audit history in the dashboard.

### `TreeMap`

Used for persistent contract storage:

- audit ID -> audit report JSON
- audit ID -> owner address

This keeps audit reports retrievable by ID and lets the frontend filter reports by connected wallet.

### `u256`

Used for the audit counter so each submitted audit receives a stable incremental audit ID.

### JSON serialization

Audit reports are stored as JSON strings so the frontend can retrieve, normalize, and render structured reports consistently.

---

## UI Tour

Real screenshots will be added later. The placeholders below reserve the intended README structure.

### 1. Landing Page

![Soothmark landing page placeholder](./docs/images/landing.png)

The landing page introduces Soothmark's focused audit scope and gives users a clear place to start an audit.

### 2. Audit Workspace

![Soothmark audit workspace placeholder](./docs/images/audit-workspace.png)

Users paste or load a GenLayer contract, connect their wallet, and submit the contract for an on-chain audit.

### 3. Audit In Progress

![Soothmark audit progress placeholder](./docs/images/audit-progress.png)

After submission, Soothmark tracks the transaction and waits for the audit report to become available from the contract.

### 4. Audit Report

![Soothmark audit report placeholder](./docs/images/audit-report.png)

The report shows the audit result, verdict, intent, nondeterminism, state impact, Verification Check, recommendations, and optional raw JSON.

### 5. Dashboard

![Soothmark dashboard placeholder](./docs/images/dashboard.png)

The dashboard gives users a wallet-scoped history of their own audits and lets them reopen individual reports.

---

## Audit Scope

Soothmark checks:

- executable nondeterministic logic
- nondeterministic state impact
- validation/equivalence coverage
- whether the protection matches the state-changing path

Soothmark does not check:

- general smart-contract vulnerabilities
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
| Rejected    | Nondeterministic output can affect saved state without proper validation/equivalence protection.     |

---

## Configuration & Environment Setup

Copy the example environment file for local development:

```bash
cp .env.example .env.local
```

Set only frontend-safe `NEXT_PUBLIC_*` values. Do not commit `.env.local`, and do not add private keys, seed phrases, mnemonics, or backend secrets. Vercel must receive the same public environment variables for deployment.

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS=
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

Useful verification commands:

```bash
pnpm lint
pnpm build
```

---

## Planned Features

### Persistent Developer Storage Improvements

The current backend stores audit reports and ownership by audit ID. A future version may improve storage ergonomics with richer indexing, faster wallet-based retrieval, and cleaner report metadata while keeping the audit path focused.

### Shareable Audit Reports

A future version may allow users to generate controlled share links for specific audit reports, making it easier to share audit results with teammates, reviewers, or hackathon judges without turning the app into a public global audit explorer.

---

## Project Status

Soothmark is an early GenLayer-native audit workspace focused on nondeterministic state-safety review.

---

## License

License to be added.

