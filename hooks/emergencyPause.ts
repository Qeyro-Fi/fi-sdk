import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex, type PublicClient } from "viem";
import { emergencyPauseAbi } from "../abi/index.js";
import { QeyroError } from "../errors.js";
import { assertAddress, assertLevel, assertUint } from "../validate.js";

export interface EmergencyPauseConfig {
  guardians: Address[];
  /** 0 = the oracle never pauses automatically; otherwise 1-5. */
  autoPauseLevel?: number;
  /** Seconds between requestUnpause and completeUnpause. Must be above 0. */
  unpauseDelay: number;
  /** Pause only value and token moves instead of every operation. */
  valueOnly?: boolean;
}

const TUPLE = [{ type: "tuple", components: [{ type: "address[]" }, { type: "uint8" }, { type: "uint32" }, { type: "bool" }] }] as const;

export function encodeEmergencyPauseConfig(c: EmergencyPauseConfig): Hex {
  if (c.guardians.length === 0) throw new QeyroError("INVALID_CONFIG", "at least one guardian is required");
  const guardians = c.guardians.map((g, i) => assertAddress(g, `guardians[${i}]`));
  if (new Set(guardians.map((g) => g.toLowerCase())).size !== guardians.length) throw new QeyroError("INVALID_CONFIG", "guardians must be unique");
  const level = assertLevel(c.autoPauseLevel ?? 0, "autoPauseLevel", { allowZero: true });
  const delay = assertUint(c.unpauseDelay, "unpauseDelay");
  if (delay === 0) throw new QeyroError("INVALID_CONFIG", "unpauseDelay must be above 0");
  return encodeAbiParameters(TUPLE, [[guardians, level, delay, c.valueOnly ?? false]]);
}

export function decodeEmergencyPauseConfig(data: Hex): Required<EmergencyPauseConfig> {
  const [[guardians, autoPauseLevel, unpauseDelay, valueOnly]] = decodeAbiParameters(TUPLE, data);
  return { guardians: [...guardians], autoPauseLevel, unpauseDelay, valueOnly };
}

export interface PauseState {
  paused: boolean;
  autoPauseLevel: number;
  unpauseDelay: number;
  valueOnly: boolean;
  unpauseRequestedAt: bigint;
  /** True when operations are blocked right now (explicit pause or oracle at/above the auto level). */
  effectivelyPaused: boolean;
}

export async function readPauseState(client: PublicClient, hook: Address, account: Address): Promise<PauseState | undefined> {
  const initialized = await client.readContract({ address: hook, abi: emergencyPauseAbi, functionName: "isInitialized", args: [account] });
  if (!initialized) return undefined;
  const [s, effectivelyPaused] = await Promise.all([
    client.readContract({ address: hook, abi: emergencyPauseAbi, functionName: "stateOf", args: [account] }),
    client.readContract({ address: hook, abi: emergencyPauseAbi, functionName: "isPaused", args: [account] }),
  ]);
  return { paused: s.paused, autoPauseLevel: s.autoPauseLevel, unpauseDelay: s.unpauseDelay, valueOnly: s.valueOnly, unpauseRequestedAt: s.unpauseRequestedAt, effectivelyPaused };
}
