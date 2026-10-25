# Security policy

QEYRO FI SDK is pre-release software and has not been independently audited.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

1. Open a private advisory: https://github.com/qeyro-fi/qeyro-fi-sdk/security/advisories/new
2. Describe what you found, how to reproduce it, and what you think the impact is.
3. If it affects deployed contracts, include the network and addresses.

You will get an acknowledgement within 7 days. We ask for a 90-day disclosure window by default so a fix can ship before details are public.

## In scope

Code in `src/`. The SDK builds calldata that people sign, so a wrong byte can cost money. We want to hear about:

- An encoder that accepts a configuration the contract would reject, or that encodes something other than what was asked
- `callHashOf` or `decodeExecute` disagreeing with the contracts
- Validation that can be bypassed (unchecked addresses, negative or overflowing numbers)
- Anything that makes `checkAccount` report an account as supported when it is not

## Out of scope

- Bugs in viem
- Weaknesses of an account implementation
- Contract-level issues (report those in `qeyro-fi-contracts`)

## What we promise (and do not)

- We will credit reporters who want credit.
- There is no bug bounty yet.
- We make no guarantee of protection against any attack. See the risk disclosures in the documentation.
