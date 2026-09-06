# Welcome and toolkit release · 2026-09-06

## Delivered

- Five mounted workspace views: practice, tools, review, report and help. Switching views preserves drafts.
- Five-step illustrative welcome; examples never write participant records.
- Expanded optional fields for four area tools, manual income/expense entries and a separate payment calendar for money organization.
- Legacy records remain valid. No schema, price, purchase duration, payment or credential change.
- 61-second optional welcome video, synthetic approved brand voice, burned-in Spanish captions, optional VTT and a full transcript.

## Media provenance

The welcome video uses local browser screenshots of the actual illustrative welcome, not customer records or a testimonial. The existing approved synthetic brand voice was reused offline. Audio agent: Maxwell; illustrative tool cases: Hegel; welcome sequence: Huygens. The Site owner integrated and reviewed all changes.

Audio source: `C:/Users/Yeica/Documents/Codex/100-dias-operaciones/bienvenida-20260906/bienvenida.mp3`.
Audio SHA-256: `8565fcfbffdb24992e1ec51be00abe779938b7cd7f350d2325a54f5daba213e3`.
Rendering source: `C:/Users/Yeica/Documents/Codex/100-dias-operaciones/bienvenida-20260906/render-welcome.mjs`.
Automatic local audio QA reported zero normalized ASR error, successful decode and no clipping. No human listening or accent assessment is claimed for the final recording.

## Verification

- Browser review at 1280×800 and 390×844, actual clicks and screenshots through CUA.
- Exercised welcome steps, transition to Day 0, profile save, finance rows and totals, tool save, draft preservation across views, routine continuation fields, review and report views, video playback and pausing on view exit.
- Corrected mobile welcome navigation, stale review counters, and video subtitle rendering discovered during visual QA.
- In-memory SQLite tests cover expanded payload persistence, concurrency, purchase isolation, refund gates, legacy records and exports. Financial arithmetic uses integer cents; future commitments are not subtracted from the ledger total.
- `METODO_LOCAL_QA=1` is an explicit Vite serve-only, loopback-only adapter using in-memory fictitious records and refusing all checkouts. It is not imported by the production Worker. The compiled artifact smoke test verifies that its flags and routes do not ship.
- No production customer record, real purchase, message, payment setting or access code was created or changed by these tests.

The public video is only an illustrative tutorial. Purchased daily curriculum and first-week audio remain protected by the existing participant APIs.
