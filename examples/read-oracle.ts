// Run with: npx tsx examples/read-oracle.ts <oracle-address>
import { createPublicClient, http, type Address } from "viem";
import { sepolia } from "viem/chains";
import { readOracle, watchThreatLevel } from "../src/index.js";

const address = process.argv[2] as Address | undefined;
if (!address) throw new Error("Usage: read-oracle.ts <oracle-address>");

const client = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) });

const state = await readOracle(client, address);
console.log(`Level ${state.level} (${state.levelName}), ${state.fresh ? "fresh" : "STALE"}`);
console.log(`${state.threshold} of ${state.attesters} attesters, last update ${new Date(state.lastUpdate * 1000).toISOString()}`);

const stop = watchThreatLevel(client, address, (c) => console.log(`Level ${c.previousLevel} -> ${c.newLevel} (proposal ${c.proposalId})`));
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
