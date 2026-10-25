// Prints the calldata an ERC-7579 account must execute to install a Quantum Threat Hook.
import { encodeInstallModule, encodeQuantumThreatConfig } from "../src/index.js";

const HOOK = "0x0000000000000000000000000000000000000001"; // replace with your deployed QuantumThreatHook

const initData = encodeQuantumThreatConfig({
  threshold: 3, // activate at "High"
  mode: "blockValue", // block value and token moves, allow everything else
  failClosed: true, // a stale oracle counts as a threat
});

console.log(encodeInstallModule("hook", HOOK, initData));
