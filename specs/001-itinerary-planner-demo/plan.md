# Implementation Plan: 多日旅遊行程編排 Demo

**Branch**: `001-itinerary-planner-demo` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-itinerary-planner-demo/spec.md`

## Summary

建立一個純瀏覽器執行的單一旅程編排器。React UI 以 reducer 維持唯一狀態，
使用者可透過表單或 Markdown 建立景點，將景點移動到多日行程、手動填寫時間，
並產生免 API key 的 Google Maps URL。所有 domain 行為維持純函式，旅程以帶版本的
localStorage 文件保存；測試涵蓋 domain、UI integration 與主要瀏覽器流程。

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22.23.2

**Primary Dependencies**: React 19.3, Vite 8.3, `@dnd-kit/core` 6.3,
`@dnd-kit/sortable` 10

**Storage**: Browser localStorage using a versioned JSON document and raw-value backup on
validation failure

**Testing**: Vitest 5, Testing Library, jsdom, Playwright 1.63

**Target Platform**: Current desktop Chrome, Firefox, and Safari-class browsers; readable
stacked layout on narrow screens

**Project Type**: Client-only single-page web application

**Performance Goals**: User-visible state updates complete within 200 ms for the MVP
validation dataset

**Constraints**: No backend, authentication, Google SDK, API key, paid runtime dependency,
or automatic route/time lookup; encoded map URLs must be at most 2,048 characters

**Scale/Scope**: One trip, up to 14 days and 50 places as the validation baseline

## Constitution Check

*GATE: Passed before research and re-checked after design.*

| Principle | Plan evidence | Status |
|-----------|---------------|--------|
| Spec First | `spec.md` is complete and requirements checklist is 16/16 | PASS |
| Local First | Static client application with localStorage only | PASS |
| Minimal Scope | No server, account, map SDK, autocomplete, or optimization | PASS |
| Deterministic Behavior | Parser, reducer, time, storage, and URL logic are pure/testable boundaries | PASS |
| No Paid Dependency | Integration is limited to ordinary Google Maps URLs | PASS |
| Accessible Interaction | dnd-kit keyboard sensor plus explicit move controls | PASS |
| Testable Requirements | Unit, integration, build, and browser smoke gates are included | PASS |
| User Data Safety | Schema validation, raw backup, and safe initial-state fallback are designed | PASS |

No constitution exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/001-itinerary-planner-demo/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── domain-contracts.md
├── checklists/
│   ├── requirements.md
│   └── ux.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── App.tsx
│   ├── App.module.css
│   └── tripReducer.ts
├── components/
│   ├── DayColumn.tsx
│   ├── MarkdownImport.tsx
│   ├── PlaceCard.tsx
│   ├── PlaceForm.tsx
│   └── TripHeader.tsx
├── domain/
│   ├── date.ts
│   ├── maps.ts
│   ├── markdown.ts
│   ├── time.ts
│   └── types.ts
├── persistence/
│   └── tripStorage.ts
├── test/
│   └── setup.ts
├── main.tsx
└── styles.css

e2e/
└── trip-planner.spec.ts

.github/workflows/
└── ci.yml
```

**Structure Decision**: 使用單一 Vite application。Domain 與 persistence 邊界不依賴
React；UI 元件只透過 typed props 與 reducer actions 變更狀態。測試與 source colocate
為 `*.test.ts(x)`，唯一的跨瀏覽器 smoke test 放在 `e2e/`。

## Design Decisions

### State and ordering

- `Trip` 是 reducer 的唯一 aggregate root。
- `Place` 保存景點內容；`Placement` 保存景點目前的容器、排序與時間。
- 每個 reducer action 完成後統一正規化每個容器的 `order`，避免重複或間斷排序值。
- 路線與畫面順序只讀取 `order`，不依開始時間自動重排。

### Import and validation

- Markdown parser 每行獨立處理，回傳 `places` 與 `errors`，不直接修改狀態。
- UI 只在使用者確認後 dispatch 有效項目；錯誤行保留於 textarea。
- 時間及分鐘驗證集中於 domain，表單與 reducer 共用相同規則。

### Persistence and recovery

- localStorage key 為 `traveling-design.trip.v1`，文件包含 `schemaVersion: 1`。
- 啟動時先 parse 並執行 runtime shape validation。
- 失敗時把原始字串寫入 `traveling-design.trip.backup.<timestamp>`，回傳 starter trip
  與 recovery message；不嘗試猜測或修補未知 schema。

### Google Maps URLs

- 一站使用 Search URL，多站使用 Directions URL。
- 一段最多五站；若加入下一站將超過五站或 2,048 字元，就在前一站結束該段，
  並以相同站點作為下一段起點。
- 不傳 `travelmode`，不呼叫任何 Google API。

### UI and accessibility

- 備案區與每天各自是一個 sortable container。
- Pointer 與 keyboard sensors 提供拖曳；每張卡另有「移到」及上下移動按鈕。
- Dialog 使用原生 `<dialog>` 或等價語意，所有 validation message 與 status update
  透過可辨識文字／live region 呈現。

## Verification Strategy

1. Unit tests：Markdown、日期、時間衝突、reducer、storage recovery、Maps URL chunking。
2. Component tests：新增、匯入、移動替代控制、時間提示、刪除確認及空狀態。
3. Browser smoke：匯入四站、安排兩天、重排、重新整理、驗證 route link。
4. Quality gates：`npm test`、`npm run build`、`npm run test:e2e`。
5. CI：pull request 與 main push 執行 unit tests、production build、Playwright Chromium。

## Post-Design Constitution Check

設計沒有新增 runtime service、credential 或付費依賴；所有高風險行為均位於可單獨測試的
domain／persistence 邊界，並提供非拖曳操作路徑。八項 constitution gate 全數維持 PASS。
