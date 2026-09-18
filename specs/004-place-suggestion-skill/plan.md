# Implementation Plan: 地名附近景點建議 Skill

**Branch**: `feature/004-place-suggestion-skill` | **Spec**: [spec.md](./spec.md)

## Summary

新增一個 project-local Codex skill，將「地名／範圍／偏好 → 網路查證候選 → 使用者確認 →
備案 Markdown block」固定成可重複的對話流程。Skill 只提供指示與輸出格式，不新增 app
runtime、server 或 API 整合。

## Design

### Skill boundary

- 入口：`.agents/skills/travel-place-suggestions/SKILL.md`。
- 觸發條件：使用者想依地名尋找附近景點，或要求產生可匯入旅程的景點 Markdown。
- 資料來源：目前可用的 web search；官方觀光／政府／場館頁面優先。
- 狀態邊界：候選與輸出只存在於回應中，不寫入 repo、旅程 Markdown、localStorage 或 app state。

### Two-phase response

1. **Discovery**：檢查地名歧義，必要時澄清；列候選、地圖搜尋文字、理由與來源。
2. **Export**：使用者確認景點後，輸出只有 list items 的 fenced Markdown block；每行四欄，缺省停留時間 60 分鐘。

兩個階段不能合併，避免未確認的網路候選直接污染使用者旅程。

### Data integrity rules

- 不把搜尋結果推論成地址、座標、營業時間或交通時間。
- 地圖搜尋文字使用官方名稱／地址，沒有時才使用「景點名稱 + 地名」的可搜尋文字。
- 半形 `|` 會破壞現有 parser 的四欄格式，因此輸出前改用全形 `｜` 或省略。
- 不輸出 `@HH:MM`，因為目標是 `## 備案`，備案景點不得帶開始時間。

## Documentation and validation

- README 說明 skill 觸發方式、兩階段流程與範例。
- `docs/examples/travel-place-suggestions.fixture.md` 提供可重播的輸入、候選與預期 block。
- 使用 skill creator 的 `quick_validate.py` 驗證 frontmatter、命名與未完成 placeholder。
- 以 fixture 手動驗收：歧義澄清、來源列出、確認前不輸出 block、確認後四欄／60 分鐘／不修改檔案。

## Constraints

- 不新增 npm dependency、runtime API key、React component、server endpoint 或自動搜尋按鈕。
- 不將來源 URL 塞入 Markdown 欄位，除非使用者明確要求；來源保留在候選清單，避免污染旅程資料。
