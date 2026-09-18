# Tasks: 多日旅遊行程編排 Demo

**Input**: Design documents from `/specs/001-itinerary-planner-demo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Domain tests are written before implementation. Component and browser tests prove each user journey and the constitution quality gates.

**Organization**: Tasks are grouped by user story so each increment remains independently demonstrable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches independent files after its prerequisites exist
- **[Story]**: Maps the task to a user story in `spec.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create a reproducible React/TypeScript project and validation toolchain.

- [X] T001 Scaffold the Vite React TypeScript application and exact npm dependencies in `package.json`, `package-lock.json`, `index.html`, `tsconfig*.json`, and `vite.config.ts`
- [X] T002 [P] Configure Vitest, Testing Library, and shared DOM setup in `vite.config.ts` and `src/test/setup.ts`
- [X] T003 [P] Configure Playwright projects and local web server in `playwright.config.ts`
- [X] T004 [P] Add the application entry shell and global design tokens in `src/main.tsx` and `src/styles.css`

**Checkpoint**: `npm test` can run an empty suite and `npm run build` can compile the shell.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the invariant-preserving data model, reducer, and persistence boundary used by every story.

**⚠️ CRITICAL**: No user story work begins until these tasks pass their tests.

- [X] T005 Define `Trip`, `Place`, `DayPlan`, `Placement`, import, warning, and action types with the exact field constraints from `data-model.md` in `src/domain/types.ts`
- [X] T006 [P] Add deterministic date helper tests for valid `YYYY-MM-DD` parsing and consecutive day generation in `src/domain/date.test.ts`
- [X] T007 [P] Implement date helpers without local-time rollover in `src/domain/date.ts` (FR-009)
- [X] T008 Add reducer tests for starter state, unique placement, continuous order, add/delete day recovery, and storage-safe immutable transitions in `src/app/tripReducer.test.ts`
- [X] T009 Implement starter trip creation, state normalization, and typed reducer actions in `src/app/tripReducer.ts` so each Place has exactly one Placement and every container order starts at 0 (FR-001, FR-010, FR-012, FR-014)
- [X] T010 Add persistence tests for valid round-trip, missing data, malformed JSON, unsupported schema, unavailable storage, and backup keys in `src/persistence/tripStorage.test.ts`
- [X] T011 Implement versioned localStorage load/save, runtime shape validation, raw backup, safe starter fallback, and non-throwing failures in `src/persistence/tripStorage.ts` (FR-022, FR-023, FR-026)

**Checkpoint**: Foundational domain and persistence tests pass without rendering React.

---

## Phase 3: User Story 1 - 建立景點備案 (Priority: P1) 🎯 MVP

**Goal**: Add, import, edit, and delete candidate places in a backlog.

**Independent Test**: Starting from an empty trip, create places through both entry paths and correct an invalid Markdown line without scheduling any day.

### Tests for User Story 1

- [X] T012 [P] [US1] Add parser tests for list markers, four pipe fields, omitted defaults, duplicate names, blank lines, partial success, line numbers, and duration 1–1,440 in `src/domain/markdown.test.ts`
- [X] T013 [P] [US1] Add component tests for single-entry validation, batch-import errors, editing, and deletion in `src/app/App.places.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Implement the pure Markdown parser contract in `src/domain/markdown.ts` (FR-003–FR-007)
- [X] T015 [P] [US1] Implement the labeled single-place form with name/location query 1–80 chars, notes up to 1,000 chars, location fallback, and duration 1–1,440 in `src/components/PlaceForm.tsx` (FR-002, FR-005)
- [X] T016 [P] [US1] Implement Markdown input, import preview/errors, and valid-line dispatch in `src/components/MarkdownImport.tsx` (FR-003–FR-006)
- [X] T017 [US1] Implement editable backlog cards and confirmed deletion behavior in `src/components/PlaceCard.tsx` and `src/app/App.tsx` (FR-008, FR-025)

**Checkpoint**: User Story 1 passes independently and provides a usable candidate-place backlog.

---

## Phase 4: User Story 2 - 編排多日行程 (Priority: P1)

**Goal**: Create days and move or reorder every place through pointer, keyboard, or explicit controls.

**Independent Test**: Arrange four places across two days, reorder them, return one to backlog, and delete a populated day without losing a place.

### Tests for User Story 2

- [X] T018 [P] [US2] Extend reducer tests for cross-container moves, same-container reorder, clearing start time on backlog return, and populated-day deletion order in `src/app/tripReducer.test.ts`
- [X] T019 [P] [US2] Add component tests for adding days, move destination controls, up/down controls, last-day protection, and deletion confirmation in `src/app/App.schedule.test.tsx`

### Implementation for User Story 2

- [X] T020 [P] [US2] Implement trip title/start-date editing and add/delete day controls in `src/components/TripHeader.tsx` (FR-001, FR-009, FR-010, FR-014)
- [X] T021 [P] [US2] Implement a reusable sortable backlog/day container with empty state in `src/components/DayColumn.tsx` (FR-011, FR-025)
- [X] T022 [US2] Add pointer and keyboard dnd-kit sensors plus explicit move/up/down actions in `src/app/App.tsx` and `src/components/PlaceCard.tsx` (FR-011–FR-013, FR-024)
- [X] T023 [US2] Apply consecutive dates and responsive multi-column-to-stacked layout in `src/app/App.tsx` and `src/app/App.module.css` (FR-009, FR-024)

**Checkpoint**: User Story 2 passes using both drag-and-drop and explicit controls.

---

## Phase 5: User Story 3 - 設定時間並辨識衝突 (Priority: P2)

**Goal**: Calculate end times and display non-blocking overlap/order warnings without changing itinerary order.

**Independent Test**: Enter overlapping then non-overlapping times for two places and confirm warnings change while order remains fixed.

### Tests for User Story 3

- [X] T024 [P] [US3] Add time tests for null time, same-day and next-day end labels, half-open overlap boundaries, and order mismatch in `src/domain/time.test.ts`
- [X] T025 [P] [US3] Add component tests for schedule input validation, visible text warnings, and unchanged order in `src/app/App.time.test.tsx`

### Implementation for User Story 3

- [X] T026 [US3] Implement pure end-time and schedule-warning functions in `src/domain/time.ts` (FR-015–FR-017)
- [X] T027 [US3] Add scheduled-place start/duration editors, end labels, overlap text, and order-warning text in `src/components/PlaceCard.tsx` and `src/app/App.tsx` (FR-015–FR-017, FR-024)

**Checkpoint**: User Story 3 passes with warnings that never mutate user ordering.

---

## Phase 6: User Story 4 - 開啟地圖路線 (Priority: P2)

**Goal**: Generate API-key-free Search or chunked Directions links in the exact visual order.

**Independent Test**: Validate zero-, one-, five-, six-, and twelve-stop route sets including long encoded queries.

### Tests for User Story 4

- [X] T028 [P] [US4] Add Maps URL tests for zero/one/multi-stop behavior, no travel mode, five-stop chunks, shared boundaries, encoding, and 2,048-character limits in `src/domain/maps.test.ts`

### Implementation for User Story 4

- [X] T029 [US4] Implement deterministic Google Maps Search/Directions URL generation and safe chunking in `src/domain/maps.ts` (FR-018–FR-021)
- [X] T030 [US4] Render per-day route buttons, segment labels, and unavailable reasons in `src/components/DayColumn.tsx` (FR-019–FR-021, FR-025)

**Checkpoint**: User Story 4 opens correctly ordered routes without an API key or preset travel mode.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Connect persistence, prove the main journey, and make the repository self-validating.

- [X] T031 Integrate initial load, save-after-valid-change, recovery notice, and storage-failure notice in `src/app/App.tsx` (FR-022, FR-023, FR-026)
- [X] T032 [P] Add an integration test for reload restoration and corrupted-storage recovery in `src/app/App.persistence.test.tsx`
- [X] T033 [P] Finish responsive, focus, status, warning, dialog, and reduced-motion styles in `src/app/App.module.css` and `src/styles.css` (FR-024, SC-005)
- [X] T034 Add the primary import→two-day arrange→time→reload→route Playwright flow in `e2e/trip-planner.spec.ts` (SC-001, SC-003–SC-006)
- [X] T035 [P] Add GitHub Actions gates for npm install, unit tests, production build, and Chromium smoke test in `.github/workflows/ci.yml`
- [X] T036 Update local setup, commands, architecture links, and MVP boundaries in `README.md`
- [X] T037 Run all scenarios in `quickstart.md`, then run `npm test`, `npm run build`, and `npm run test:e2e` and record only verified completion in this task list
- [X] T038 Add and run a deterministic 50-place/14-day reducer performance check under the 200 ms budget in `src/app/tripReducer.performance.test.ts` (SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational → User Stories → Polish.
- US1 establishes place creation used by the UI demonstrations for later stories.
- US2 establishes placement ordering used by time warnings and Maps routes.
- US3 and US4 are independent after US2.

### Parallel Opportunities

- T002–T004 can proceed after T001 because they touch independent setup files.
- Domain test files marked `[P]` can be written independently before their implementations.
- Component files marked `[P]` can be implemented after their reducer/domain contracts exist.
- T032, T033, and T035 can proceed independently after application integration is stable.

## Implementation Strategy

1. Complete setup and domain invariants before rendering feature UI.
2. Deliver US1 as the smallest useful backlog-only demo.
3. Add multi-day placement and verify accessible alternate controls.
4. Add time and Maps behaviors as independent pure-domain increments.
5. Connect persistence and run the complete browser journey.

## Notes

- Tests precede their corresponding implementation tasks.
- Every completed task is marked `[X]` only after its relevant test or build command passes.
- File paths and field constraints are decision-complete; implementation must not invent additional services or schemas.

---

## Phase 8: Markdown-first Revision

**Goal**: Replace form-based editing with one canonical Markdown editor, drag synchronization, and deterministic Markdown／CSV／JSON output.

Phases 1–7 record the original form-based implementation. Phase 8 supersedes its form and visible move-control tasks while retaining the tested domain, persistence, and Maps boundaries.

- [X] T039 Update `spec.md` and `plan.md` for the Markdown-first interaction contract.
- [X] T040 Add full-document parser and Markdown／CSV／JSON serializer tests in `src/domain/markdown.test.ts`.
- [X] T041 Implement pure full-document parsing and serialization in `src/domain/markdown.ts`.
- [X] T042 Add reducer replacement support while preserving deterministic move behavior.
- [X] T043 Replace form-based `App` flow with draft parsing, last-valid rendering, drag rewrite, and live outputs.
- [X] T044 Simplify `PlaceCard` and `DayColumn` to display-only sortable components with pointer and keyboard drag.
- [X] T045 Replace obsolete component tests and Playwright flow with Markdown-first acceptance scenarios.
- [X] T046 Update README and quickstart examples.
- [X] T047 Run `npm test`, `npm run build`, and `npm run test:e2e`; mark this phase complete only after all pass.

---

## Phase 9: Hourly Day Timeline

**Goal**: Render every day as a 24-hour timeline and let pointer drops assign whole-hour start times.

- [X] T048 Update spec and plan with hourly timeline behavior.
- [X] T049 Add reducer and component tests for explicit drop time, 24 slots, and unscheduled placement.
- [X] T050 Extend `MOVE_PLACE` with an optional target start time while preserving existing move semantics.
- [X] T051 Render an unscheduled drop area and 24 hourly droppable rows in each day column.
- [X] T052 Update drag handling so slot drops write `@HH:00` into all derived outputs.
- [X] T053 Update quickstart and Playwright coverage for a real drop into the 09:00 slot.
- [X] T054 Run unit, build, Playwright, and CI gates.

## Phase 10: Markdown Format Hint

**Goal**: Show a light, non-editable Markdown example above the editor without changing trip data.

- [X] T055 Update spec and plan, render the syntax example, and add component coverage for the hint.
