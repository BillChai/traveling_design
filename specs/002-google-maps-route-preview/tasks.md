# Tasks: Google Maps 路線預覽

後續 Cloud／API key 設定追蹤於 [Issue #3](https://github.com/BillChai/traveling_design/issues/3)。

- [X] T001 Amend constitution to permit the no-charge optional Maps Embed preview.
- [X] T002 Add the feature spec, technical plan, and local setup contract.
- [X] T003 Add deterministic Embed URL builder tests.
- [X] T004 Implement Embed URL generation using existing route segments.
- [X] T005 Add DayColumn iframe preview and missing-key fallback tests.
- [X] T006 Render accessible lazy route previews without changing ordinary route links.
- [X] T007 Add `.env.example`, README setup, and manual quickstart validation.
- [X] T008 Run unit, build, Playwright, and CI gates.
- [ ] T009 Create a Google Cloud project and enable only `Maps Embed API` (manual, user-owned account).
- [ ] T010 Create a browser key restricted to `Maps Embed API` and `http://localhost:5173/*`, then place it in local `.env.local`.
- [ ] T011 Verify one-place and multi-place iframe previews locally; keep ordinary Google Maps links as fallback.
