# Feature Specification: Markdown-first 多日旅遊編排 Demo

**Feature Branch**: `001-itinerary-planner-demo`

**Created**: 2026-09-17

**Status**: Implemented

**Input**: 使用者以 Markdown 描述備案與日期，透過拖曳調整配置及順序，前端同步產生依時間表排序的 Markdown、CSV、JSON 與 Google Maps 路線。

## Clarifications

### Session 2026-09-17

- Markdown 是唯一可編輯來源，不提供逐筆新增、編輯、刪除或日期管理表單。
- `## 備案` 表示尚未排定的景點；`## Day N | YYYY-MM-DD` 表示一個可拖入的日期欄。
- 景點格式為 `- @HH:MM 名稱 | 地圖搜尋文字 | 分鐘 | 備註`，時間可省略。
- 使用者直接修改 Markdown 來新增、編輯、刪除景點、日期及時間。
- 拖曳成功後，系統把目前配置與順序序列化回標準 Markdown。
- CSV 與 JSON 是目前有效行程的唯讀衍生輸出，不另行保存。
- 路線不預設交通方式；時間衝突只提示，不自動排序。
- 視覺上不提供移動按鈕，但拖曳卡片必須支援 pointer 與鍵盤操作。
- 每個日期欄以可捲動的 `00:00` 至 `23:00` hourly timeline 顯示；沒有開始時間的景點置於日期內的「未設定時間」。
- 使用 pointer 將景點拖到 hourly slot 時，開始時間設為該小時的 `HH:00` 並回寫 Markdown。
- Markdown textarea 上方 MUST 顯示非可編輯、低對比的格式範例，且範例不得成為旅程資料。

## User Scenarios & Testing

### User Story 1 - 用 Markdown 建立行程（Priority: P1）

作為使用者，我想貼上或編輯一份可閱讀的 Markdown，直接建立旅程名稱、備案、日期及景點，而不必逐一操作表單。

**Independent Test**: 貼上包含備案、兩天及時間資訊的 Markdown，確認右側立即渲染相同內容和順序。

**Acceptance Scenarios**:

1. **Given** 有效 Markdown，**When** 使用者貼入編輯器，**Then** 備案與每個日期欄依文件順序渲染。
2. **Given** 景點帶有 `@09:00` 與 90 分鐘，**When** 解析成功，**Then** 卡片顯示 09:00–10:30。
3. **Given** 使用者正在輸入而形成無效行，**When** parser 回報錯誤，**Then** 顯示行號並保留最後一次有效的視覺行程。
4. **Given** 使用者修正所有錯誤，**When** 文件再次有效，**Then** 視覺行程完整更新。

### User Story 2 - 以拖曳重新編排行程（Priority: P1）

作為使用者，我想把景點在備案與日期間拖曳或重新排序，並讓 Markdown 自動反映結果。

**Independent Test**: 將一個備案拖入 Day 1，再於 Day 1 重新排序，確認畫面與標準 Markdown 的 section 及行順序一致。

**Acceptance Scenarios**:

1. **Given** 備案有景點，**When** 使用者拖入某一天，**Then** 該景點只出現在目標日期，且 Markdown 行移入對應 heading。
2. **Given** 同一天有多個景點，**When** 使用者拖曳排序，**Then** Markdown 與所有輸出採用新順序。
3. **Given** 已排定景點被拖回備案，**When** 移動完成，**Then** 開始時間被清除。
4. **Given** 使用者只使用鍵盤，**When** 以 Alt 與方向鍵操作 focused card，**Then** 能跨欄及調整同欄順序。
5. **Given** 某一天已有排定與未排定景點，**When** 行程渲染，**Then** 排定景點出現在對應小時列，未排定景點出現在「未設定時間」。
6. **Given** 使用者將景點拖到 Day 1 的 09:00 slot，**When** 放下卡片，**Then** 卡片顯示於 09:00 列且 Markdown 加上 `@09:00`。

### User Story 3 - 取得排序後的資料輸出（Priority: P1）

作為使用者，我想即時看到標準 Markdown、CSV 與 JSON，讓視覺編排結果能帶到其他工具。

**Independent Test**: 編排含備案和兩天的行程，確認三種輸出包含相同景點、容器、時間與順序。

**Acceptance Scenarios**:

1. **Given** 有效行程，**When** 任一 Markdown 編輯或拖曳完成，**Then** 標準 Markdown、CSV、JSON 同步更新。
2. **Given** 欄位含逗號、引號或換行，**When** 產生 CSV，**Then** 欄位依 RFC 4180 方式引用且資料不遺失。
3. **Given** 景點沒有開始時間，**When** 產生輸出，**Then** `startTime` 與 `endTime` 保持空值，不虛構時間。
4. **Given** 有備案景點，**When** 產生 CSV／JSON，**Then** 備案仍被包含並與日期景點區分。

### User Story 4 - 保存與開啟路線（Priority: P2）

作為使用者，我想重新整理後保留最後有效行程，並依每天目前順序開啟 Google Maps 路線。

**Acceptance Scenarios**:

1. **Given** 有效 Markdown 或拖曳變更，**When** 重新整理，**Then** 內容、配置與順序仍存在。
2. **Given** 儲存資料損毀，**When** 載入頁面，**Then** 應用程式保留原始備份並顯示可操作的 starter document。
3. **Given** 一站行程，**When** 開啟地圖，**Then** 產生 Search URL。
4. **Given** 多站行程，**When** 開啟地圖，**Then** Directions URL 依畫面順序且不含 `travelmode`。

## Markdown Contract

```md
# 東京旅行

## 備案

- 上野公園 | 上野公園 | 60 | 賞櫻

## Day 1 | 2026-10-03

- @09:00 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
- 東京晴空塔 | 東京スカイツリー | 120 |
```

- 第一個 `# ` heading 為旅程名稱；省略時使用「我的旅程」。
- 文件必須包含且只能包含一個 `## 備案`，並至少包含一個日期 section。
- 日期可省略，但存在時必須為 `YYYY-MM-DD`。
- list item 只允許出現在備案或日期 section 中。
- 名稱必填且最多 80 字；地圖搜尋文字省略時使用名稱。
- 停留時間省略時為 60 分鐘，允許 1 至 1,440 的整數。
- 備註最多 1,000 字；欄位總數不得超過四個。
- `@HH:MM` 只允許出現在日期 section；備案景點不得帶時間。
- 空白行忽略；錯誤必須包含原始行號。

## Functional Requirements

- **FR-001**: 系統 MUST 提供單一 Markdown textarea 作為唯一編輯介面。
- **FR-002**: 系統 MUST 依 Markdown Contract 解析旅程，且 parser MUST 為 deterministic pure function。
- **FR-003**: 解析失敗 MUST 保留 textarea 草稿及最後一次有效行程，不得部分套用。
- **FR-004**: 系統 MUST 以文字列出所有錯誤行號及原因。
- **FR-005**: 系統 MUST 將有效文件渲染成一個備案欄及依文件順序排列的日期欄。
- **FR-006**: 使用者 MUST 能以 pointer 或 keyboard drag-and-drop 在欄位間移動及排序景點。
- **FR-007**: 每個景點 MUST 同時只存在於一個容器。
- **FR-008**: 拖曳完成 MUST 將完整有效狀態序列化回標準 Markdown。
- **FR-009**: 景點拖回備案 MUST 清除開始時間；其他移動 MUST 保留時間及分鐘。
- **FR-010**: 系統 MUST 根據開始時間與停留分鐘顯示結束時間和非阻斷式衝突警告。
- **FR-011**: 系統 MUST 即時產生依容器及 `order` 排序的 Markdown、CSV、JSON。
- **FR-012**: CSV MUST 正確引用特殊字元；JSON MUST 使用明確的 `backlog` 與 `days[].items` 結構。
- **FR-013**: 一站 MUST 產生 Google Maps Search URL；多站 MUST 產生 Directions URL。
- **FR-014**: Maps URL MUST 使用視覺順序、不指定交通方式，且依五站／2,048 字元限制分段。
- **FR-015**: 每次有效狀態變更 MUST 保存，並在重新整理後還原相同內容及順序。
- **FR-016**: 損毀或不支援的儲存內容 MUST 備份原始值並載入安全 starter document。
- **FR-017**: UI MUST 使用繁體中文，錯誤及警告不得只依賴顏色。
- **FR-018**: UI MUST NOT 提供逐筆景點表單、景點編輯表單、日期管理表單或可見的移動控制按鈕。
- **FR-019**: 每個日期 MUST 顯示 `00:00` 至 `23:00` 共 24 個一小時間隔，並在固定高度容器內垂直捲動。
- **FR-020**: 日期內沒有開始時間的景點 MUST 顯示於獨立的「未設定時間」drop area。
- **FR-021**: 景點拖入 hourly slot MUST 將開始時間更新為該 slot 的 `HH:00`；拖入「未設定時間」 MUST 清除開始時間。
- **FR-022**: Hourly slot drop 完成後 MUST 同步更新 canonical Markdown、CSV、JSON 與 localStorage。
- **FR-023**: Markdown 編輯區 MUST 在 textarea 上方顯示包含旅程、備案、日期與 `@HH:MM` 的輕量格式範例；範例 MUST 不可編輯且不得寫入任何輸出或 localStorage。
- **FR-024**: 有開始時間的景點卡片 MUST 依停留分鐘數顯示視覺高度：60 分鐘至少佔一個小時格，180 分鐘應跨越三個小時格；此視覺高度不得改變排序或時間計算。

## Success Criteria

- **SC-001**: 使用者能只靠 Markdown 與拖曳建立兩日四站行程。
- **SC-002**: 每次有效輸入或拖曳後，三種輸出包含完全相同的景點集合與順序。
- **SC-003**: Parser、serializer、CSV、JSON、時間與 Maps URL 都有 deterministic tests。
- **SC-004**: 50 個景點與 14 天文件的解析及狀態更新在測試環境 200 毫秒內完成。
- **SC-005**: `npm test`、`npm run build` 與 Playwright smoke test 全部通過。
- **SC-006**: 每個日期渲染恰好 24 個可辨識 hourly slots，且真實 pointer drop 到指定 slot 後四種資料表示的開始時間一致。

## Out of Scope

- 景點搜尋、autocomplete、Maps JavaScript API 與自動路線最佳化。
- 自動交通時間、營業時間、預約、預算、帳號、後端、同步與多人協作。
- 自訂 Markdown dialect、保留非語意 whitespace 或任意註解位置。
- CSV／JSON 檔案下載、雲端分享與外部匯入。

Optional Maps Embed route preview 由後續 `002-google-maps-route-preview` feature spec 定義；
本規格的 keyless Search／Directions URL 仍是必要 fallback。
