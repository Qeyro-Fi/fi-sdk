import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex, type PublicClient } from "viem";
import { deFiRiskHookAbi } from "../abi/index.js";
import { ZERO_ADDRESS } from "../constants.js";
import { QeyroError } from "../errors.js";
import { assertAddress, assertLevel, assertUint } from "../validate.js";

export interface DeFiRiskConfig {
  /** Calls to protocols flagged at or above this severity revert. 0 = never. */
  blockSeverity?: number;
  /** At or above this severity a single-use approval is required. Must be below blockSeverity. 0 = never. */
  confirmSeverity?: number;
  approver?: Address;
  approvalTtl?: number;
}

const TUPLE = [{ type: "tuple", components: [{ type: "uint8" }, { type: "uint8" }, { type: "address" }, { type: "uint32" }] }] as const;

export function encodeDeFiRiskConfig(c: DeFiRiskConfig): Hex {
  const block = assertLevel(c.blockSeverity ?? 0, "blockSeverity", { allowZero: true });
  const confirm = assertLevel(c.confirmSeverity ?? 0, "confirmSeverity", { allowZero: true });
  if (block !== 0 && confirm >= block) throw new QeyroError("INVALID_CONFIG", "confirmSeverity must be below blockSeverity");
  const ttl = assertUint(c.approvalTtl ?? 0, "approvalTtl");
  let approver: Address = ZERO_ADDRESS;
  if (confirm !== 0) {
    if (!c.approver) throw new QeyroError("INVALID_CONFIG", "approver is required when confirmSeverity is set");
    approver = assertAddress(c.approver, "approver");
    if (ttl === 0) throw new QeyroError("INVALID_CONFIG", "approvalTtl must be above 0 when confirmSeverity is set");
  } else if (c.approver) {
    approver = assertAddress(c.approver, "approver");
  }
  return encodeAbiParameters(TUPLE, [[block, confirm, approver, ttl]]);
}

export function decodeDeFiRiskConfig(data: Hex): Required<DeFiRiskConfig> {
  const [[blockSeverity, confirmSeverity, approver, approvalTtl]] = decodeAbiParameters(TUPLE, data);
  return { blockSeverity, confirmSeverity, approver, approvalTtl };
}

export interface ProtocolFlag {
  severity: number;
  updatedAt: bigint;
  evidenceHash: Hex;
}

export async function readProtocolFlag(client: PublicClient, hook: Address, protocol: Address): Promise<ProtocolFlag> {
  const [severity, updatedAt, evidenceHash] = await client.readContract({ address: hook, abi: deFiRiskHookAbi, functionName: "flagOf", args: [assertAddress(protocol, "protocol")] });
  return { severity, updatedAt, evidenceHash };
}
