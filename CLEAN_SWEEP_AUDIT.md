# Sound Merge Clean Sweep

This document tracks the production-readiness sweep of the existing Sound Merge codebase.

## Upgraded in this pass
- Release Rails canonical release records and external-workflow job queue.
- Prompt Architect: rough idea -> title, style prompt, structured lyrics, BPM, arrangement and generation notes.
- Music generation gateway moved server-side.
  - Mureka: official API path.
  - Suno: official API adapter slots that require the user's Suno Platform endpoint configuration.
  - Udio: explicitly browser-agent/manual because no public API is available.
  - Studio: intentionally labeled local preview.
- Integration Center shows REAL API / BROWSER AGENT / ADAPTER NEEDED / MIGRATION NEEDED / NOT CONFIGURED.
- Chartmetric refresh token and analytics access moved server-side.
- Random Chartmetric/YouTube/stream/engagement values removed from analytics UI.
- RapidAPI proxy now verifies Firebase sessions.
- System automation webhook moved server-side.
- Gemini/AI staff and prompt tasks moved server-side; Gemini key is no longer injected into the Vite browser bundle.
- Hardcoded client credentials removed from Kling, Kits, Resemble and Alchemy current source.
- Alchemy data access moved behind authenticated server proxy; fake wallet and price fallbacks removed.
- Global permissive CORS header removed.

## Intentionally not called production-ready yet
- Kling video rendering: current UI/service is still a simulation and needs a real server adapter.
- Kits stem/voice processing: old client integration needs a secure server adapter.
- Resemble watermarking/deepfake/voice operations: disabled until secure server adapter is connected.
- Songtradr submission: old implementation is simulated.
- Google Calendar: old implementation is simulated.
- DAO/blockchain governance: demo state.
- Solana minting / NFT issuance: portions remain simulated.
- Lighthouse/IPFS storage: old implementation contains simulations.
- Revenue Recovery: demo scan.
- CRM fallback data: contains demo records when provider calls fail.
- Battles / Academy / Catalog seed data: sample/demo content.

## Rule going forward
Sound Merge may show demo or preview experiences, but they must be labeled as demo/preview. A provider can only be marked connected or complete after Sound Merge receives a real provider response or a confirmed browser-agent action.
