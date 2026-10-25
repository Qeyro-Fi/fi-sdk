import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex, type PublicClient } from "viem";
import { transactionLimitHookAbi } from "../abi/index.js";
import { ZERO_ADDRESS } from "../constants.js";
import { QeyroError } from "../errors.js";
import { assertAddress, assertUint } from "../validate.js";

export interface TransactionLimitConfig {
  /** Wei; 0n = unlimited. */
  maxPerTx?: bigint;
  /** Wei per UTC day; 0n = unlimited. */
  dailyLimit?: bigint;
  /** A single call above this value needs approval; 0n = never. */
  approvalAbove?: bigint;
  /** Only destinations marked Allowed may be called. */
  allowlistOnly?: boolean;
  approver?: Address;
  approvalTtl?: number;
}

export type Destination = "none" | "allowed" | "blocked";
export const DESTINATION_VALUE: Record<Destination, 0 | 1 | 2> = { none: 0, allowed: 1, blocked: 2 };

const TUPLE = [{ type: "tuple", components: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "bool" }, { type: "address" }, { type: "uint32" }] }] as const;

export function encodeTransactionLimitConfig(c: TransactionLimitConfig): Hex {
  const max = c.maxPerTx ?? 0n;
  const daily = c.dailyLimit ?? 0n;
  const above = c.approvalAbove ?? 0n;
  if (max < 0n || daily < 0n || above < 0n) throw new QeyroError("INVALID_CONFIG", "limits cannot be negative");
  if (max !== 0n && daily !== 0n && max > daily) throw new QeyroError("INVALID_CONFIG", "maxPerTx cannot exceed dailyLimit");
  const ttl = assertUint(c.approvalTtl ?? 0, "approvalTtl");
  let approver: Address = ZERO_ADDRESS;
  if (above !== 0n) {
    if (!c.approver) throw new QeyroError("INVALID_CONFIG", "approver is required when approvalAbove is set");
    approver = assertAddress(c.approver, "approver");
    if (ttl === 0) throw new QeyroError("INVALID_CONFIG", "approvalTtl must be above 0 when approvalAbove is set");
  } else if (c.approver) {
    approver = assertAddress(c.approver, "approver");
  }
  return encodeAbiParameters(TUPLE, [[max, daily, above, c.allowlistOnly ?? false, approver, ttl]]);
}

export function decodeTransactionLimitConfig(data: Hex): Required<TransactionLimitConfig> {
  const [[maxPerTx, dailyLimit, approvalAbove, allowlistOnly, approver, approvalTtl]] = decodeAbiParameters(TUPLE, data);
  return { maxPerTx, dailyLimit, approvalAbove, allowlistOnly, approver, approvalTtl };
}

export async function readTransactionLimitConfig(client: PublicClient, hook: Address, account: Address) {
  const initialized = await client.readContract({ address: hook, abi: transactionLimitHookAbi, functionName: "isInitialized", args: [account] });
  if (!initialized) return undefined;
  const c = await client.readContract({ address: hook, abi: transactionLimitHookAbi, functionName: "configOf", args: [account] });
  return { maxPerTx: c.maxPerTx, dailyLimit: c.dailyLimit, approvalAbove: c.approvalAbove, allowlistOnly: c.allowlistOnly, approver: c.approver, approvalTtl: c.approvalTtl } as Required<TransactionLimitConfig>;
}

/** Amount of native value already counted against today's limit for an account (UTC day). */
export async function readSpentToday(client: PublicClient, hook: Address, account: Address, nowSeconds = Math.floor(Date.now() / 1000)): Promise<bigint> {
  const day = BigInt(Math.floor(nowSeconds / 86_400));
  return client.readContract({ address: hook, abi: transactionLimitHookAbi, functionName: "spentOnDay", args: [account, day] });
}

/** Calldata for the account to call `setDestination` on the hook. */
export function destinationCall(dest: Address, status: Destination) {
  return { functionName: "setDestination" as const, args: [assertAddress(dest, "dest"), DESTINATION_VALUE[status]] as const, abi: transactionLimitHookAbi };
}
