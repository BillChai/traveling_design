# Traveling Design Constitution

## Core Principles

### I. Spec First

Every user-visible behavior change MUST begin with an update to the active feature's
`spec.md`. Technical choices MUST be derived in `plan.md`, and executable work MUST be
tracked in `tasks.md` before implementation. Code and tests MUST NOT become the only
record of intended behavior. This keeps product intent reviewable and prevents accidental
scope changes during implementation.

### II. Local First

The MVP MUST run entirely in the user's browser and local development environment. It
MUST NOT require a backend, account, authentication, database, cloud deployment, or
network service for core planning behavior. Local-first behavior keeps the demo easy to
run and makes failures reproducible.

### III. Minimal Scope

Implementation MUST be limited to behavior covered by explicit acceptance criteria.
Speculative abstractions, future-facing integrations, and unrequested configuration MUST
NOT be added. Any complexity beyond the simplest design that satisfies the current spec
MUST be justified in `plan.md`.

### IV. Deterministic Behavior

Markdown parsing, time calculations, state transitions, persistence recovery, and Google
Maps URL generation MUST be implemented as deterministic behavior with stable inputs and
outputs. These behaviors MUST be testable without live network calls or external APIs.

### V. No Paid Dependency

The MVP MUST NOT use Maps JavaScript API, Places API, Routes API, or any runtime service
that can accrue usage charges. Ordinary Google Maps Search and Directions URLs MUST remain
available without an API key. The no-charge Maps Embed API MAY be used only as an optional
route preview with a browser-visible, API-restricted key; missing credentials or network
access MUST NOT block itinerary planning or the ordinary route links.

### VI. Accessible Interaction

Every drag-and-drop operation MUST have a keyboard-accessible or explicit button-based
alternative. Interactive controls MUST have visible labels, focus states, and semantic
HTML. Acceptance criteria MUST cover the non-pointer path so itinerary editing is not
limited to mouse users.

### VII. Testable Requirements

Every user story MUST have independent acceptance scenarios. Every functional requirement
MUST map to at least one automated test or an explicit manual validation step. Pure domain
logic MUST be unit tested, and the primary end-to-end planning journey MUST have an
automated browser smoke test.

### VIII. User Data Safety

Valid changes MUST persist across page refreshes. Invalid or corrupted local data MUST
NOT crash the application or silently overwrite recoverable data. Recovery behavior and
schema-version handling MUST be specified and tested before persistence is considered
complete.

## MVP Constraints

- The supported product is a single local trip containing multiple days and one shared
  backlog of places.
- The application MUST use Node.js 22 and npm for reproducible local development.
- Runtime secrets and server-side Google API keys MUST NOT be introduced. A restricted,
  browser-visible Maps Embed API key MAY be supplied through a gitignored local environment
  file and MUST NOT be committed.
- Application state MUST remain inspectable and portable within the browser; no hidden
  server state is permitted.
- Traditional Chinese is the default UI and documentation language. Technical identifiers
  MAY remain in English.

## Development Workflow and Quality Gates

1. Update and review the active `spec.md` before technical planning.
2. Resolve material ambiguities before creating or changing `plan.md`.
3. Run the requirements checklist and cross-artifact analysis before implementation.
4. Implement tasks in dependency order and mark only verified tasks complete.
5. Run unit tests, integration tests, the production build, and the browser smoke test
   before declaring convergence.
6. Run convergence against the current spec, plan, and tasks; any reported gap MUST be
   implemented or explicitly returned to the specification phase.

Reviews MUST reject changes that bypass a MUST rule. A temporary exception MUST be
documented in `plan.md` with scope, rationale, and removal criteria; exceptions to
Principle V require a constitution amendment rather than a plan-level waiver.

## Governance

This constitution supersedes local conventions when they conflict. Amendments MUST state
the motivation, affected principles, migration impact, and semantic version change. A
MAJOR version removes or redefines a non-negotiable principle, a MINOR version adds or
materially expands governance, and a PATCH version clarifies wording without changing
obligations.

Every feature review MUST check constitution compliance at specification, planning, task,
and convergence stages. `AGENTS.md` supplies execution guidance but MUST NOT weaken this
constitution.

## Amendment 1.1.0

- **Motivation**: Allow users to see an ordered Google Maps route inside the local demo.
- **Affected principles**: Principle V and the runtime-key MVP constraint.
- **Migration impact**: Route links remain the keyless baseline; preview setup is optional
  and uses only the no-charge Maps Embed API with a restricted browser key.
- **Version change**: MINOR, because governance now permits one narrowly scoped optional
  credentialed integration without weakening the prohibition on chargeable APIs.

**Version**: 1.1.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
