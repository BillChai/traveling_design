# Research: 多日旅遊行程編排 Demo

## React state boundary

**Decision**: 使用 React `useReducer` 管理整個 `Trip`，domain helper 保持純函式。

**Rationale**: MVP 只有單一 aggregate root，reducer 能讓 action、invariant 與測試對應，
不需要額外 state library。

**Alternatives considered**:

- Zustand：API 簡潔，但目前規模不足以合理化額外狀態層。
- 多個 `useState`：初期簡單，但跨容器移動、刪日回收及 persistence 容易產生不一致。

## Drag-and-drop

**Decision**: 使用 dnd-kit sortable containers，同時提供 keyboard sensor 與按鈕替代路徑。

**Rationale**: 能支援同容器排序、跨容器移動及鍵盤操作，且不要求把 domain ordering
耦合到 library event shape。

**Alternatives considered**:

- HTML Drag and Drop API：桌面可行，但鍵盤及觸控一致性較差。
- 只提供按鈕：可及性佳，但無法展示使用者要求的拖曳體驗。

## Persistence validation

**Decision**: 使用小型手寫 runtime guard 驗證 versioned JSON，不加入 schema library。

**Rationale**: schema 只有五個 entity／value object，手寫 guard 可保持依賴與 bundle 小，
並能明確執行備份後 fallback。

**Alternatives considered**:

- Zod：對大型或多版本 schema 有價值，但此 MVP 只需要一個固定文件格式。
- 直接 type assertion：無法保護使用者免於 corrupted storage crash。

## Maps integration

**Decision**: 使用 Google Maps Search／Directions URL；每段最多五站並同時檢查
2,048 字元上限。

**Rationale**: 無 API key 或 billing，仍能把目前順序交給 Google Maps。五站包含起點、
終點與最多三個 mobile browser waypoint。

**Alternatives considered**:

- Maps Embed API：使用本身免費，但仍需要 Cloud project、billing 與 API key，使用者已排除。
- Maps JavaScript／Routes API：能顯示 marker 或算路線，但違反 no paid dependency 原則。

## Testing layers

**Decision**: Vitest + Testing Library 驗證 domain 與 component，Playwright 只保留一條主要 smoke。

**Rationale**: 純函式由快速 unit tests 覆蓋；真正的 drag／reload／link 行為只需一條
瀏覽器流程驗證，避免重複且緩慢的 E2E suite。

**Alternatives considered**:

- 全部以 Playwright 測試：接近實際操作但回饋慢、debug 成本高。
- 只用 jsdom：無法充分驗證瀏覽器 reload 與真實 drag interaction。

## Toolchain

**Decision**: Node.js 22.23.2、npm、React 19.3、Vite 7.3.6、Vitest 5 與
Playwright 1.63，精確版本由 `package-lock.json` 固定。

**Rationale**: Node 22 是 LTS 線且符合現行 Vite 需求；npm 已存在於使用者環境，
不增加 package manager。

**Alternatives considered**:

- Node 18：不符合現行 Vite 需求。
- Node 26：目前不是本專案選定的 LTS 基線。
- Vite 8：目前 `@vitejs/plugin-react` 的正式 peer range 尚未接受 Vite 8，避免以
  `--force` 安裝未宣告相容的組合。
