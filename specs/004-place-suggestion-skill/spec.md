# Feature Specification: 地名附近景點建議 Skill

**Feature Branch**: `feature/004-place-suggestion-skill`

**Status**: Implemented

**Input**: 使用者提供一個地名，希望得到可選的附近景點，確認後產生能直接貼入本專案 `## 備案` 區的 Markdown。

## User Scenarios & Testing

### User Story 1 - 由地名取得候選景點（Priority: P1）

使用者提供地名與可選的範圍／偏好，系統根據目前網路資料整理附近候選，讓使用者先檢視再選擇。

**Independent Test**: 提供一個明確城市名稱與「歷史景點」偏好，確認回應列出候選、地圖搜尋文字、推薦理由與來源，而未修改旅程資料。

**Acceptance Scenarios**:

1. **Given** 地名足以定位，**When** 使用者要求附近景點，**Then** 列出候選與可查證來源，且優先使用官方來源。
2. **Given** 地名有同名地點或無法判斷國家／城市，**When** 使用者提出搜尋，**Then** 先詢問澄清，不擅自選擇地點。
3. **Given** 使用者提供範圍或偏好，**When** 產生候選，**Then** 候選理由反映該條件；未提供的條件不得被假設成硬性限制。
4. **Given** 營業時間、交通或距離沒有可靠來源，**When** 整理候選，**Then** 標示未確認或省略，不虛構精確資料。

### User Story 2 - 確認後產生備案 Markdown（Priority: P1）

使用者從候選清單選定景點後，希望取得可直接貼入旅程的標準 Markdown。

**Independent Test**: 選定兩個候選，其中一個未指定停留時間，確認輸出順序、四欄格式與 60 分鐘預設值。

**Acceptance Scenarios**:

1. **Given** 使用者尚未確認候選，**When** agent 回應，**Then** 只列出候選，不產生或聲稱已加入備案。
2. **Given** 使用者確認候選，**When** agent 產生輸出，**Then** 回傳 fenced Markdown block，每行為 `- 名稱 | 地圖搜尋文字 | 分鐘 | 備註`。
3. **Given** 使用者沒有指定停留時間，**When** 產生景點行，**Then** `分鐘` 為 `60`。
4. **Given** 景點資料含半形 `|` 或未知欄位，**When** 產生景點行，**Then** 維持四欄並省略／替換不可靠內容，避免破壞 parser。
5. **Given** block 已產生，**When** 使用者查看結果，**Then** agent 明確說明需由使用者自行貼入，且不修改旅程檔案、localStorage 或 app 狀態。

## Functional Requirements

- **SUG-001**: Skill MUST 接受地名，並可接受搜尋範圍與偏好。
- **SUG-002**: 地名不足以唯一定位時，Skill MUST 先提出澄清問題。
- **SUG-003**: Skill MUST 使用目前可用的網路資料搜尋附近候選，且優先官方觀光／政府／場館來源。
- **SUG-004**: 候選清單 MUST 包含景點名稱、地圖搜尋文字、推薦理由與來源連結。
- **SUG-005**: Skill MUST 在使用者確認前只列候選，不產生可匯入 block。
- **SUG-006**: 確認後 MUST 產生 fenced Markdown block，且每行固定四欄。
- **SUG-007**: 未指定停留時間時 MUST 使用 60 分鐘。
- **SUG-008**: Skill MUST 不虛構營業時間、交通、距離、票價、預約或座標。
- **SUG-009**: Skill MUST NOT 自動修改旅程檔案、localStorage、app state 或 workspace。
- **SUG-010**: Skill MUST NOT 新增 runtime API key、Places／Maps／Routes API 或 app 內自動搜尋。

## Markdown Contract

產生的 block 不包含 `## 備案` heading，只包含可貼到該 heading 下的 list items：

```md
- 名稱 | 地圖搜尋文字 | 分鐘 | 備註
```

半形 `|` 不得出現在欄位內容中；必要時使用全形 `｜`。景點行不得含 `@HH:MM`，因為輸出目標是備案區。

## Success Criteria

- **SC-001**: 明確地名的請求能得到至少一組有來源的候選清單，且不修改旅程資料。
- **SC-002**: 確認後的每一行都能直接符合本專案 Markdown parser 的四欄格式。
- **SC-003**: 未指定分鐘時，所有輸出景點行均為 60 分鐘。
- **SC-004**: 地名歧義、資料未查證與使用者尚未確認三種情況都有明確且可手動驗收的行為。

## Out of Scope

- React UI、後端、API key、Google Places／Maps／Routes API 與自動化地圖搜尋。
- 自動把候選加入行程、寫入 localStorage、建立檔案或改寫使用者 Markdown。
- 自動最佳化路線、計算交通時間、查詢營業時間或判定景點是否適合使用者。
