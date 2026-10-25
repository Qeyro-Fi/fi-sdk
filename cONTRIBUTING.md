# Contributing to QEYRO FI SDK

The SDK builds calldata that people sign, so a wrong byte can cost money. It must agree with the contracts exactly.

## Before you start

- Open an issue for a new function and say what you want to build with it.
- Found a bug that could make someone sign the wrong thing? Do not open an issue. Follow `SECURITY.md`.

## Set up

```bash
git clone https://github.com/qeyro-fi/qeyro-fi-sdk && cd qeyro-fi-sdk
npm install
npm test                # 18 tests
```

## How a good change looks

1. If a rule is enforced on-chain, enforce it in the encoder too and test the rejection with its message.
2. If you touch hashing or encoding, take the expected value from the **deployed contract** and pin it in a test. A test that compares the SDK with itself proves nothing.
3. Document public API changes in `README.md` and `CHANGELOG.md`. Before 1.0, breaking changes go in minor versions and are called out.

## Commit messages

Name the function and the rule:

```
Reject confirmSeverity >= blockSeverity in encodeDeFiRiskConfig

The contract reverts with InvalidConfig; fail before the user pays for gas.
```

## SDK rules

- Mirror the contracts. If a rule is enforced on-chain, enforce it in the encoder too and test the rejection.
- Keep "unknown" unknown: never turn `undefined` into `false` or `true`.
- Imports use the `.js` extension (the package is ESM, built with NodeNext).
- When you touch hashing or encoding, generate the expected value from the deployed contract and pin it in the test. A test that compares the SDK with itself proves nothing.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Conduct

Be respectful and specific. See `CODE_OF_CONDUCT.md`.
