# Hosting modes

The original static website remains in Git. This hosting layer has three explicit
build modes; keep their artifacts separate.

- `npm run build`: historical owner-only review, including the legacy participant
  prototype. Never publish this artifact as a public shop.
- `npm run build:prelaunch`: public sample and waitlist, without participant code.
- `npm run build:sales`: commercial landing, PayPal checkout, purchase-scoped
  access and server-backed records. Lesson content exists only in the Worker;
  the public member HTML is a shell, not an entitlement.

See `LIVE-RELEASE.md` for supported plans, configuration, tests and remaining
payment-acceptance checks. Runtime secrets belong in Sites, not this repository.
`CHECKOUT_ENABLED=false` closes new purchases without disabling existing access,
receipts or verified payment/refund notifications.

Run `npm test`, build the intended mode, commit and push that exact source,
package with the official Sites helper, and save/deploy the matching version.
Sites metadata belongs in `.openai/hosting.json`. Do not include an unrestricted
source tree, credentials or legacy public access flags in a sales artifact.
