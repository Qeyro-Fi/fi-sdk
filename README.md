# @qeyro-fi/sdk

TypeScript helpers for the **QEYRO FI** threat oracle and Security Hooks, built on [viem](https://viem.sh).

> Pre-release. The contracts this SDK talks to are unaudited and not deployed.

## Install

```bash
npm install @qeyro-fi/sdk viem
```

## What it does

- **Read the oracle**: level, freshness, quorum, evidence, proposals, and a live watcher.
- **Encode hook configuration** for all five modules, with the same validation the contracts apply, so a bad config fails before you spend gas.
- **Build ERC-7579 calldata**: `installModule`, `uninstallModule`, and `execute` (single and batch), plus a decoder that mirrors how hooks inspect calls.
- **Compute approval hashes** that match `SecurityHookBase.callHashOf`.
- **Check account compatibility** without pretending: unknown stays unknown.

## Examples

Read the verified threat level:

```ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { readOracle } from "@qeyro-fi/sdk";

const client = createPublicClient({ chain: sepolia, transport: http() });
const oracle = await readOracle(client, ORACLE_ADDRESS);
if (!oracle.fresh) console.warn("oracle is stale");
console.log(oracle.level, oracle.levelName);
```

Build the install call for a hook:

```ts
import { encodeInstallModule, encodeTransactionLimitConfig } from "@qeyro-fi/sdk";

const initData = encodeTransactionLimitConfig({
  maxPerTx: 1n * 10n ** 18n,
  dailyLimit: 5n * 10n ** 18n,
});
const calldata = encodeInstallModule("hook", HOOK_ADDRESS, initData);
// submit `calldata` through your account's own execution path (for example a UserOperation)
```

Prepare a single-use approval for a large transfer:

```ts
import { encodeExecute, encodeApproveCall } from "@qeyro-fi/sdk";

const data = encodeExecute({ target: recipient, value: 10n ** 18n });
const approveCalldata = encodeApproveCall({ account, msgSender: owner, data });
// the approver sends `approveCalldata` to the hook before the owner's call
```

More in `examples/`.

## API overview

| Area | Functions |
| --- | --- |
| Oracle | `readOracle`, `getLevelIfFresh`, `readProposal`, `watchThreatLevel` |
| Quantum Threat Hook | `encodeQuantumThreatConfig`, `decodeQuantumThreatConfig`, `readQuantumThreatConfig` |
| Transaction Limit Hook | `encodeTransactionLimitConfig`, `decodeTransactionLimitConfig`, `readTransactionLimitConfig`, `readSpentToday`, `destinationCall` |
| Emergency Pause | `encodeEmergencyPauseConfig`, `decodeEmergencyPauseConfig`, `readPauseState` |
| DeFi Risk Hook | `encodeDeFiRiskConfig`, `decodeDeFiRiskConfig`, `readProtocolFlag` |
| Recovery | `encodeRecoveryConfig`, `decodeRecoveryConfig`, `readRecoveryRequest`, `isRecoveryExecutable` |
| Accounts | `encodeInstallModule`, `encodeUninstallModule`, `checkAccount`, `isModuleInitialized` |
| Execution | `encodeExecute`, `encodeSingleExecution`, `encodeBatchExecution`, `decodeExecute` |
| Approvals | `callHashOf`, `encodeApproveCall` |
| Errors | `QeyroError` (`code`: `INVALID_ADDRESS`, `INVALID_LEVEL`, `INVALID_CONFIG`, `INVALID_EXECUTION`) |

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

The ABIs in `src/abi/generated.ts` come from the `qeyro-fi-contracts` repository (`npm run export-abi`).

## License

MIT
