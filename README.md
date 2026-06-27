# ⚡ BlitzPass — Live Event Experiences, on Monad

Turn any live event — a **concert**, an **esports final**, a **festival**, a **meetup** — into a real-time, on-chain consumer experience.

Scan a QR → your wallet is created instantly (no app, no seed phrase, **no gas**) → claim your **BlitzPass** → fire off **reactions** → and watch the room come alive on the big screen: a live **activity feed**, a **most-active leaderboard**, and counters showing **every reaction landing on-chain in real time**.

Built for **Monad Blitz Ankara** on the Monad parallel-EVM testnet.

---

## Why this is a *Monad* app (not a Firebase app)

Every claim and every reaction is a **real on-chain transaction**. The stage screen shows a live **transaction + TPS counter** — proof you're watching the chain, not a database. A room full of phones hammering reactions at once is exactly what Monad's **parallel execution, 400ms blocks and high throughput** are built for. And the BlitzPass + reaction history lives in the attendee's own wallet — portable proof-of-presence that outlives the event.

## How it works

| Piece | Tech |
|------|------|
| Smart contract (`BlitzPass`) | Solidity + Hardhat, deployed to Monad testnet (chain `10143`) |
| Gasless onboarding | Browser **burner wallet** (viem) + backend **relayer pool** that sponsors gas |
| Phone app | Next.js (App Router) + viem — join, claim, react |
| Stage screen | Live feed + leaderboard + attendee / tx / TPS counters, driven by on-chain events |
| Vibrant events showcase | Poster-style covers for concerts, esports, festivals & meetups |

Onboarding & indexing are aligned with the Monad ecosystem ([MONSKILLS](https://skills.devnads.com)): **Para** embedded MPC wallets and **Envio HyperIndex** are the drop-in upgrades for production; this demo ships a self-contained viem path for live-demo reliability.

## Repo layout

```
contracts/   Hardhat project — BlitzPass.sol, tests, deploy script
web/         Next.js app — events showcase, phone app, stage screen, relayer API
```

## Quickstart

```bash
# 1) contracts
cd contracts
npm install
npm run keys                       # generates deployer + relayer pool keys
# fund the printed addresses at https://faucet.monad.xyz, put PRIVATE_KEY in contracts/.env
npm test                           # run the test suite
npm run deploy                     # deploy to Monad testnet -> writes web/lib/blitzpass.json

# 2) web
cd ../web
npm install
# put RELAYER_KEYS=0x..,0x.. in web/.env.local
npm run dev                        # http://localhost:3000
```

Monad testnet: RPC `https://testnet-rpc.monad.xyz` · chainId `10143` · faucet `https://faucet.monad.xyz`

> ⚠️ Hackathon code. Wallets are demo burners; do not reuse keys or ship unaudited contracts to mainnet.
