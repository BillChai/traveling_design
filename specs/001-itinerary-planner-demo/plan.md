# Implementation Plan: Markdown-first 多日旅遊編排 Demo

**Branch**: `001-itinerary-planner-demo` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-itinerary-planner-demo/spec.md`

## Summary

建立一個純瀏覽器執行的 Markdown-first 行程編排器。使用者只在 textarea 編輯旅程；
有效文件解析成 reducer state 並渲染為 sortable board。拖曳會更新 state，再由 serializer
回寫標準 Markdown。CSV、JSON、時間提示與 Google Maps URL 全部由同一份 state 派生。
解析失敗時保留草稿與最後一次有效畫面，不部分套用。

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22.23.2

**Primary Dependencies**: React 19.3, Vite 7.3.6, `@dnd-kit/core` 6.3,
`@dnd-kit/sortable` 10

**Storage**: Browser localStorage using a versioned JSON document and raw-value backup on
validation failure

**Testing**: Vitest 5, Testing Library, jsdom, Playwright 1.63

**Target Platform**: Current desktop Chrome, Firefox, and Safari-class browsers; readable
stacked layout on narrow screens

**Project Type**: Client-only single-page web application

**Performance Goals**: User-visible state updates complete within 200 ms for the MVP
validation dataset

**Constraints**: No form-based editor, backend, authentication, chargeable Google API,
or automatic route/time lookup. The optional no-charge Maps Embed preview is defined
separately in feature `002`.

**Scale/Scope**: One trip, up to 14 days and 50 places as the validation baseline

## Constitution Check

*GATE: Passed before research and re-checked after design.*

| Principle | Plan evidence | Status |
|-----------|---------------|--------|
| Spec First | `spec.md` is complete and requirements checklist is 16/16 | PASS |
| Local First | Static client application with localStorage only | PASS |
| Minimal Scope | No server, account, map SDK, autocomplete, or optimization | PASS |
| Deterministic Behavior | Parser, reducer, time, storage, and URL logic are pure/testable boundaries | PASS |
| No Paid Dependency | Keyless URLs remain baseline; feature `002` only permits the no-charge Embed SKU | PASS |
| Accessible Interaction | Pointer drag plus focused-card Alt + arrow keyboard movement | PASS |
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
│   └── PlaceCard.tsx
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

### Markdown parse and serialize

- `parseTripMarkdown` 一次解析完整文件，只有零錯誤時才產生新的 `Trip`。
- `serializeTripMarkdown` 依 backlog、days 與 order 產生 canonical Markdown。
- 使用者輸入的無效草稿與最後有效 `Trip` 分開保存於 component state。
- pointer drag 或 focused-card Alt + arrow keyboard movement dispatch `MOVE_PLACE`，完成後才觸發 canonical rewrite。
- `serializeTripCsv` 與 `serializeTripJson` 只讀相同 `Trip`，不維護第二份資料。
- CSV 下載沿用 `serializeTripCsv` 的 canonical 內容；CSV serializer 先將日期容器的項目依日期、開始時間（無時間者最後）與 `order` 排序，再將 backlog 項目附在末尾並標示 `section=backlog`。UI 以固定檔名 `travel-itinerary.csv` 建立 browser download；空行程仍輸出 header。

### Persistence and recovery

- localStorage key 為 `traveling-design.trip.v1`，文件包含 `schemaVersion: 1`。
- 啟動時先 parse 並執行 runtime shape validation。
- 失敗時把原始字串寫入 `traveling-design.trip.backup.<timestamp>`，回傳 starter trip
  與 recovery message；不嘗試猜測或修補未知 schema。

### Google Maps URLs

- 一站使用 Search URL，多站使用 Directions URL。
- 每個日期固定產生一條路線 URL；所有站點依畫面順序放入同一個 Directions URL，不自動拆段。
- 普通 Search／Directions URL 不傳 `travelmode`，也不呼叫任何 Google API。
- Feature `002-google-maps-route-preview` 可選擇性地把相同日期路線轉成 Maps Embed iframe；
  缺少 key 時普通 URL 行為不變。

### UI and accessibility

- 左側為唯一 Markdown textarea，右側為備案及日期 sortable containers，下方顯示三種輸出。
- Markdown textarea 上方顯示非可編輯、低對比的 canonical syntax example；它是 UI hint，不進入 parser 或 persisted state。
- 整張卡片是 pointer drag handle；Alt + 左右方向鍵跨欄，Alt + 上下方向鍵同欄排序。
- 日期 container 內含「未設定時間」drop area 與 24 個 hourly droppable rows；drop data 直接攜帶 `dayId` 與 `startTime`。
- 有開始時間的卡片以 `max(一小時 row 高度, durationMinutes / 60 × row 高度)` 設定最小視覺高度，並在固定高度的 hourly row 上溢出覆蓋後續小時格；不得讓起始 row 因卡片高度而變高。備案與未設定時間卡片不套用此高度。
- `MOVE_PLACE` 只在 hourly drop 明確提供時間時覆寫 `startTime`，一般跨欄移動仍保留既有時間，回到備案一律清除。
- 不渲染新增、編輯、刪除、日期或移動按鈕；這些操作全部透過 Markdown 或拖曳完成。
- Parser errors、schedule warnings 與 storage notice 使用可辨識文字／live region。

## Verification Strategy

1. Unit tests：Markdown、日期、時間衝突、reducer、storage recovery、one-route-per-day Maps URL。
2. Component tests：新增、匯入、移動替代控制、時間提示、刪除確認及空狀態。
3. Browser smoke：匯入四站、安排兩天、重排、重新整理、驗證 route link。
4. Quality gates：`npm test`、`npm run build`、`npm run test:e2e`；E2E 驗證 CSV 下載檔名與日期／backlog 順序。
5. CI：pull request 與 main push 執行 unit tests、production build、Playwright Chromium。

## Post-Design Constitution Check

核心設計沒有新增必要 runtime service 或付費依賴；feature `002` 的 optional browser key
與 no-charge Embed preview 已由 constitution 1.1.0 明確限制。所有高風險行為均位於可單獨
測試的 domain／persistence 邊界，並提供非拖曳操作路徑。八項 constitution gate 全數維持 PASS。
