import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex, type PublicClient } from "viem";
import { quantumThreatHookAbi } from "../abi/index.js";
import { ZERO_ADDRESS } from "../constants.js";
import { QeyroError } from "../errors.js";
import { assertAddress, assertLevel, assertUint } from "../validate.js";

export type QuantumThreatMode = "blockAll" | "blockValue" | "requireApproval";
const MODES: QuantumThreatMode[] = ["blockAll", "blockValue", "requireApproval"];

export interface QuantumThreatConfig {
  /** Level 1-5 at which the hook activates. */
  threshold: number;
  mode: QuantumThreatMode;
  /** Treat a stale oracle as an active threat. */
  failClosed: boolean;
  /** Required for `requireApproval`. */
  approver?: Address;
  /** Seconds an approval stays valid. Required (> 0) for `requireApproval`. */
  approvalTtl?: number;
}

const TUPLE = [{ type: "tuple", components: [{ type: "uint8" }, { type: "uint8" }, { type: "bool" }, { type: "address" }, { type: "uint32" }] }] as const;

/** Encode the `initData` for installing QuantumThreatHook. */
export function encodeQuantumThreatConfig(c: QuantumThreatConfig): Hex {
  const threshold = assertLevel(c.threshold, "threshold", { allowZero: false });
  const mode = MODES.indexOf(c.mode);
  if (mode < 0) throw new QeyroError("INVALID_CONFIG", `unknown mode ${String(c.mode)}`);
  const ttl = assertUint(c.approvalTtl ?? 0, "approvalTtl");
  let approver: Address = ZERO_ADDRESS;
  if (c.mode === "requireApproval") {
    if (!c.approver) throw new QeyroError("INVALID_CONFIG", "approver is required for requireApproval");
    approver = assertAddress(c.approver, "approver");
    if (ttl === 0) throw new QeyroError("INVALID_CONFIG", "approvalTtl must be above 0 for requireApproval");
  } else if (c.approver) {
    approver = assertAddress(c.approver, "approver");
  }
  return encodeAbiParameters(TUPLE, [[threshold, mode, c.failClosed, approver, ttl]]);
}

export function decodeQuantumThreatConfig(data: Hex): Required<QuantumThreatConfig> {
  const [t] = decodeAbiParameters(TUPLE, data);
  const [threshold, mode, failClosed, approver, approvalTtl] = t;
  return { threshold, mode: MODES[mode] ?? "blockAll", failClosed, approver, approvalTtl };
}

/** Read the configuration an account has installed. Returns undefined if the account has not installed the hook. */
export async function readQuantumThreatConfig(client: PublicClient, hook: Address, account: Address) {
  const initialized = await client.readContract({ address: hook, abi: quantumThreatHookAbi, functionName: "isInitialized", args: [account] });
  if (!initialized) return undefined;
  const c = await client.readContract({ address: hook, abi: quantumThreatHookAbi, functionName: "configOf", args: [account] });
  return { threshold: c.threshold, mode: MODES[c.mode] ?? "blockAll", failClosed: c.failClosed, approver: c.approver, approvalTtl: c.approvalTtl } as Required<QuantumThreatConfig>;
}
