# Traveling Design

一個 local-first 的旅遊行程編排 demo。使用者可以建立景點備案、安排多日行程、設定時間，並依景點順序開啟 Google Maps 路線。

本專案使用 [GitHub Spec Kit](https://github.com/github/spec-kit) 進行 Spec-Driven Development。需求、技術設計與工作拆分分別維護在 `spec.md`、`plan.md` 與 `tasks.md`。

## 環境需求

- Node.js 22.23.2
- npm
- GitHub Spec Kit 1.0.6
- Codex

## Spec Kit 流程

Codex integration 位於 `.agents/skills`，在 Codex 中依序使用：

```text
$speckit-constitution
$speckit-specify
$speckit-clarify
$speckit-plan
$speckit-checklist
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

每個步驟都必須 review 產出的 artifact；需求有變更時，從 `spec.md` 開始修正，而不是直接改程式碼。

## MVP 邊界

- 單一、多日旅程
- UI 單筆新增與 Markdown 批次匯入
- 備案區與每日行程間的拖曳排序
- 手動開始時間、停留時間與衝突提示
- Google Maps Search／Directions URL
- 瀏覽器 localStorage 保存
- 無後端、無登入、無 Google API key、無內嵌地圖

詳細需求會建立於 `specs/001-itinerary-planner-demo/`。
