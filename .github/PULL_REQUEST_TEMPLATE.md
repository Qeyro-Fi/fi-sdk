## What changed

<!-- Which exports and what they do now. -->

## Why

## Checklist

- [ ] New validation has a test for the rejection case with the error message
- [ ] If hashing or encoding changed, the pinned test vector was regenerated from the deployed contract (not from the SDK itself)
- [ ] No behaviour is silently different from the contracts (`qeyro-fi-contracts`): link the contract commit
- [ ] Public API changes are in `README.md` and `CHANGELOG.md`
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
- [ ] Breaking change? Say so in the PR title (pre-1.0 minor bump)
