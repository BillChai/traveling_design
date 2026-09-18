# Feature Specification: Google Maps 路線預覽

**Feature Branch**: `001-itinerary-planner-demo`

**Created**: 2026-09-17

**Status**: Implemented

## User Story - 在行程旁查看路線（Priority: P1）

作為使用者，我想在每天的時間軸旁直接看到依目前景點順序產生的 Google Maps
路線，以便不用離開編排畫面就能快速確認動線。

### Acceptance Scenarios

1. **Given** 日期有一站且已設定 Embed key，**When** 行程渲染，**Then** 顯示該地點的 Google Maps 預覽。
2. **Given** 日期有兩站以上且已設定 Embed key，**When** 行程渲染，**Then** 顯示依 placement order 的 directions 預覽，且不預設交通方式。
3. **Given** 路線因既有限制分成多段，**When** 行程渲染，**Then** 每一段都有對應預覽及原有外部路線連結。
4. **Given** 未設定 Embed key，**When** 日期有景點，**Then** 顯示本機設定提示，原有 Search／Directions 連結仍可使用。
5. **Given** key 已設定，**When** iframe 尚未進入 viewport，**Then** 瀏覽器使用 lazy loading，不阻塞核心編排介面。

## Functional Requirements

- **FR-001**: 系統 MUST 由目前日期的 placement order 產生 Embed URL，不依開始時間重新排序。
- **FR-002**: 一站 MUST 使用 Maps Embed `place` mode，多站 MUST 使用 `directions` mode。
- **FR-003**: Directions preview MUST 使用 origin、destination 與中繼 waypoints，且 MUST NOT 傳送 `mode`。
- **FR-004**: Preview MUST 與現有五站／2,048 字元 route segments 使用相同站點分段。
- **FR-005**: API key MUST 只從 `VITE_GOOGLE_MAPS_EMBED_API_KEY` 讀取，且 `.env.local` MUST 保持 gitignored。
- **FR-006**: 缺少 key 時 MUST 不建立 iframe request，並 MUST 保留普通 Google Maps 連結。
- **FR-007**: iframe MUST 有可辨識 title、lazy loading、fullscreen 與官方建議的 referrer policy。

## Success Criteria

- **SC-001**: Embed URL builder 對零站、一站、多站、分段與省略交通方式都有 deterministic tests。
- **SC-002**: Component test 能驗證有 key 時的 iframe URL及無 key 時的 fallback。
- **SC-003**: `npm test`、`npm run build` 與 Playwright smoke test 全部通過。

## Out of Scope

- Maps JavaScript API、Places API、Routes API、地理編碼、自動路線最佳化。
- 在 UI 中輸入、保存或管理 API key。
- 自動選擇開車、步行、大眾運輸或任何交通方式。
