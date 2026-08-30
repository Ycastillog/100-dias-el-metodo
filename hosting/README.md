# Private review deployment

The original static website remains the source of the design. The hosting layer
packages an explicit allowlist for a private Sites review, disables payment links,
adds a visible review notice, prevents indexing and rejects POST requests.

This is not a public sales release and must remain owner-only. The participant
experience still uses browser-local progress and the legacy access flag; neither
is authentication. A paid launch requires server-validated purchases, real user
authentication, a working customer-registration destination and delivery tests.

Do not enable public access to this review or connect the customer-facing domain
until its launch scope has been confirmed and the relevant blockers resolved.

Run `npm test`, then `npm run build`. Sites metadata belongs in
`.openai/hosting.json`; never store a source credential in this repository.
