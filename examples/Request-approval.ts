// Compute the approval an approver must grant for one specific account call.
import { callHashOf, encodeApproveCall, encodeExecute } from "../src/index.js";

const account = "0x1111111111111111111111111111111111111111";
const owner = "0x2222222222222222222222222222222222222222";
const recipient = "0x3333333333333333333333333333333333333333";

const data = encodeExecute({ target: recipient, value: 10n ** 18n });
const target = { account, msgSender: owner, value: 0n, data } as const;

console.log("call hash:", callHashOf(target));
console.log("approver sends this to the hook:", encodeApproveCall(target));
