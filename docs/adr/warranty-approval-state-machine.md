# ADR: Warranty Approval Correctness

## Status

Accepted for V1 implementation.

## Context

Warranty approval touches registrations, warranties, products and audit logs. MongoDB Atlas transaction availability can vary by cluster tier and deployment choices, so correctness cannot depend only on multi-document transactions.

The platform must allow multiple submitted registrations for the same serial, but only one final approved warranty for a normalized serial.

## Decision

Use a guarded state-machine approach backed by unique indexes:

- `warranties.serial_normalized` is globally unique.
- Approval code must re-read the registration and current warranty/product state immediately before approval.
- Approval creates the warranty with an idempotency key and unique warranty number.
- Registration is moved to `APPROVED` only after warranty creation succeeds.
- Product status is updated to `REGISTERED` when a product-master match exists.
- Audit logs record every decision and the serial-validation snapshot.

If a duplicate-key error occurs while creating the warranty, the approval returns a conflict and does not silently create or overwrite another warranty.

## Consequences

- Correctness is protected even without MongoDB multi-document transactions.
- A repair command can later reconcile rare partial states such as warranty-created-but-registration-not-marked-approved.
- Admin UI must show conflicts clearly and require an explicit reject/conflict-resolution path.
