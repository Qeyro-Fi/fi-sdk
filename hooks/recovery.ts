import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex, type PublicClient } from "viem";
import { recoveryModuleAbi } from "../abi/index.js";
import { QeyroError } from "../errors.js";
import { assertAddress, assertUint } from "../validate.js";

export const MIN_RECOVERY_TIMELOCK = 86_400;
export const MAX_RECOVERY_GUARDIANS = 10;

export interface RecoveryConfig {
  guardians: Address[];
  /** Approvals required, 1..guardians.length. */
  threshold: number;
  /** Seconds, at least 86400. */
  timelock: number;
}

const TUPLE = [{ type: "tuple", components: [{ type: "address[]" }, { type: "uint8" }, { type: "uint32" }] }] as const;

export function encodeRecoveryConfig(c: RecoveryConfig): Hex {
  const guardians = c.guardians.map((g, i) => assertAddress(g, `guardians[${i}]`));
  if (guardians.length === 0 || guardians.length > MAX_RECOVERY_GUARDIANS) throw new QeyroError("INVALID_CONFIG", `between 1 and ${MAX_RECOVERY_GUARDIANS} guardians are required`);
  if (new Set(guardians.map((g) => g.toLowerCase())).size !== guardians.length) throw new QeyroError("INVALID_CONFIG", "guardians must be unique");
  const threshold = assertUint(c.threshold, "threshold", 255);
  if (threshold < 1 || threshold > guardians.length) throw new QeyroError("INVALID_CONFIG", "threshold must be between 1 and the number of guardians");
  const timelock = assertUint(c.timelock, "timelock");
  if (timelock < MIN_RECOVERY_TIMELOCK) throw new QeyroError("INVALID_CONFIG", `timelock must be at least ${MIN_RECOVERY_TIMELOCK} seconds`);
  return encodeAbiParameters(TUPLE, [[guardians, threshold, timelock]]);
}

export function decodeRecoveryConfig(data: Hex): RecoveryConfig {
  const [[guardians, threshold, timelock]] = decodeAbiParameters(TUPLE, data);
  return { guardians: [...guardians], threshold, timelock };
}

export interface RecoveryRequest {
  active: boolean;
  newController: Address;
  approvals: number;
  executeAfter: bigint;
  expiresAt: bigint;
}

export async function readRecoveryRequest(client: PublicClient, module: Address, account: Address): Promise<RecoveryRequest> {
  const r = await client.readContract({ address: module, abi: recoveryModuleAbi, functionName: "requestOf", args: [account] });
  return { active: r.active, newController: r.newController, approvals: r.approvals, executeAfter: r.executeAfter, expiresAt: r.expiresAt };
}

/** True when a request can be executed at `nowSeconds`. */
export function isRecoveryExecutable(r: RecoveryRequest, threshold: number, nowSeconds: number): boolean {
  return r.active && r.approvals >= threshold && BigInt(nowSeconds) >= r.executeAfter && BigInt(nowSeconds) <= r.expiresAt;
}
