# Tasks: 地名附近景點建議 Skill

**Input**: Design documents from `/specs/004-place-suggestion-skill/`

## Phase 1: Specification

- [X] T001 撰寫地名歧義、網路查證、候選確認與 Markdown 匯出 acceptance criteria
- [X] T002 定義四欄備案 Markdown、60 分鐘預設與不自動修改資料的邊界

## Phase 2: Skill implementation

- [X] T003 新增 `.agents/skills/travel-place-suggestions/SKILL.md` 與觸發描述
- [X] T004 [P] 加入候選清單格式、官方來源優先與未查證資料處理規則
- [X] T005 [P] 加入確認後 fenced Markdown block 與 parser-safe 欄位規則

## Phase 3: Documentation and validation

- [X] T006 更新 README 的 project-local skill 說明與使用範例
- [X] T007 [P] 新增可重播的格式 fixture，覆蓋預設分鐘、順序與四欄輸出
- [X] T008 執行 skill frontmatter validation 與 `git diff --check`

## Completion gate

- [X] T009 確認本 feature 沒有新增 runtime API key、網路 SDK、app 自動搜尋或檔案寫入流程
