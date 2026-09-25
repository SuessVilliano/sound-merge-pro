# Sound Merge Clean Sweep

This document tracks the production-readiness sweep of the existing Sound Merge codebase.

## Production integrity changes completed

- Release Rails is the canonical release record and external-workflow job queue.
- Prompt Architect now turns a rough idea into a title, style prompt, structured lyrics, BPM, arrangement, tags and generation notes.
- Music generation is routed through authenticated server endpoints:
  - Mureka: real server-side API path when configured.
  - Suno: server-side adapter slots; generation is enabled only when the official API key and endpoint configuration are present.
  - Udio: explicitly browser-agent/manual; no fake public API is claimed.
  - Studio: clearly labeled local preview.
- Integration Center reports the truth state of providers: REAL API / BROWSER AGENT / ADAPTER NEEDED / MIGRATION NEEDED / NOT CONFIGURED / RETIRING.
- Chartmetric token exchange and artist analytics moved server-side; fabricated analytics were removed.
- RapidAPI requests now require a verified Firebase session.
- System webhook delivery moved server-side; the destination is no longer exposed in the browser.
- Gemini prompt/staff tasks moved server-side; the Gemini credential is no longer bundled by Vite.
- Alchemy data access moved behind an authenticated server proxy.
- Current-source hardcoded credentials were removed from Alchemy, Kling, Kits and Resemble code.
- Global permissive CORS response headers were removed from the Vercel config.
- Authentication no longer contains a hardcoded master-login bypass.
- Signup no longer forwards plaintext passwords to automation webhooks.
- Firebase/auth failures no longer silently create a successful fake user; Sandbox remains explicit local preview only.
- Wallet flows no longer fabricate TipLink, Phantom or smart-wallet addresses.
- Solana transaction verification fails closed; minting cannot fabricate mint addresses or signatures.
- Voice protection no longer fabricates clone detections, biometric registrations or takedown success.
- Lighthouse/IPFS can no longer return fabricated CIDs or fake ZIP bundles.
- Google Calendar no longer pretends OAuth succeeded or returns fake tour dates.
- CRM failures now return empty/failed states instead of fake contacts, threads, messages or send success.
- Revenue Recovery no longer displays fabricated royalty dollars or claims.
- Paid plan buttons no longer mutate the user plan or record a sale without a real billing provider.
- Funding/advance forms remain useful as internal request intake, but are explicitly separated from external underwriting, approval or lender transmission.
- Voice Marketplace cannot claim a profile was listed or licensing activated without a real marketplace provider.
- DAO voting no longer returns fake on-chain success.
- Kling Cinema Forge no longer deducts credits or returns a stock sample video as if it were a real render.
- Kits stem/voice features no longer return synthetic fallback audio as successful provider output.
- Songtradr direct-submit simulation was removed; the retiring Marketplace is treated as a transition state.

## Real/usable now when credentials are configured

- Firebase authentication and Firestore-backed app data.
- Server-side Gemini Prompt Architect / AI staff tasks.
- Mureka generation.
- Suno generation after the official Suno Platform endpoint configuration is supplied.
- RapidAPI signal proxy.
- Chartmetric artist search and Spotify audience analytics.
- Alchemy NFT/token/price reads.
- Authenticated system webhook relay.
- Phantom wallet connection and Solana payment-request URL generation.
- Internal Sound Merge records: releases, opportunity requests and funding-request intake.

## Still requires a real adapter/provider before production use

- Kling video generation.
- Kits stem separation / voice conversion.
- Resemble watermarking, detection, synthesis and cloning.
- Solana/Metaplex minting and metadata storage.
- Lighthouse/Filecoin uploads and encrypted asset storage.
- Google Calendar OAuth and event sync.
- CRM/GHL gateway authentication and messaging.
- Smart-account creation / account abstraction.
- Billing/subscriptions.
- Royalty-source integrations for recovery.
- External funding-partner delivery/underwriting.
- Voice licensing marketplace.
- DAO/governance contract.
- Battles, Academy and Catalog seed/sample content still function as product-demo content and should remain labeled accordingly.

## Security follow-up

Any credential or password that was ever committed to repository history should be rotated/revoked at the provider, even though current source no longer contains or uses it. Removing a secret from the latest file does not erase it from Git history.

## Rule going forward

Sound Merge may show demo or preview experiences, but they must be labeled as demo/preview. A provider can only be marked connected, submitted, paid, minted, listed, recovered, approved or complete after Sound Merge receives a real provider response or a confirmed browser-agent action.
