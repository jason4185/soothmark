# Soothmark

Soothmark is a GenLayer-native intelligent contract auditor. It audits whether nondeterministic logic that can affect saved contract state is protected by the right validation or equivalence mechanism before that state change is trusted.

The frontend is a focused audit workspace for submitting GenLayer contracts, waiting for the on-chain audit result, opening the full report, and reviewing wallet-scoped audit history.

## Scope

Soothmark checks one narrow path:

```text
intent -> nondeterminism -> state impact -> validation/equivalence
```

It recognizes nondeterministic contract behavior such as GenLayer web/render/prompt calls, traces whether that output can influence persistent state, and reports whether the state-changing path is protected by an appropriate validation or equivalence mechanism.

Soothmark is not a general smart-contract security scanner. It does not claim to perform exploit detection, dependency scanning, broad code quality review, or full-contract safety review.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Start the app:

```bash
pnpm dev
```

Open the local URL printed by Next.js.

## Environment Variables

Only public frontend configuration is used. Do not commit private secrets.

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS=0x1839df28ac6595E4C941faB3BdB392a5aA5C0718
NEXT_PUBLIC_SOOTHMARK_CHAIN=testnetBradbury
NEXT_PUBLIC_SOOTHMARK_RPC_ENDPOINT=https://rpc-bradbury.genlayer.com
NEXT_PUBLIC_SOOTHMARK_RECEIPT_STATUS=ACCEPTED
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-bradbury.genlayer.com
NEXT_PUBLIC_SOOTHMARK_USE_MOCKS=false
NEXT_PUBLIC_SOOTHMARK_ENABLE_GLOBAL_AUDIT_SCAN=false
NEXT_PUBLIC_SOOTHMARK_DEBUG=false
```

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is required for reliable wallet connection in deployed environments.

`NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS` points to the deployed Soothmark contract.

`NEXT_PUBLIC_SOOTHMARK_RPC_ENDPOINT` is the GenLayer RPC endpoint used by the frontend contract client.

`NEXT_PUBLIC_GENLAYER_EXPLORER_URL` is used to build transaction explorer links while an audit is waiting for the stored report.

`NEXT_PUBLIC_SOOTHMARK_DEBUG=true` enables Soothmark-specific debug logs in development. It is off by default.

Keep mock/global-scan switches set to `false` for production demos.

## Deployment

1. Configure the environment variables above in the deployment platform.
2. Set `NEXT_PUBLIC_SOOTHMARK_USE_MOCKS=false`.
3. Set `NEXT_PUBLIC_SOOTHMARK_ENABLE_GLOBAL_AUDIT_SCAN=false`.
4. Provide a valid `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
5. Build the app:

```bash
pnpm build
```

6. Start the production server where applicable:

```bash
pnpm start
```

## Demo Flow

1. Open the landing page.
2. Connect a wallet.
3. Open `Audit Contract`.
4. Load or paste `SimpleStorage`.
5. Submit the audit.
6. Wait for the GenLayer audit result.
7. Open the full audit report.
8. Show the audit path and Verification Check details.
9. Open the dashboard.
10. Show wallet-scoped audit history.
11. Submit an unsafe nondeterministic contract.
12. Show the rejected result and report explanation.

## Checks

Run before deployment:

```bash
pnpm lint
pnpm build
```
