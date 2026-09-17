# AGENTS.md

## 溝通

- 所有說明、review 與文件預設使用繁體中文；程式識別字與技術專有名詞保留英文。

## 開發原則

- 產品行為以 `specs/` 下的 feature specification 為唯一來源。
- 需求改變時，先更新 `spec.md`，再同步 `plan.md` 與 `tasks.md`，最後修改程式碼。
- 只實作 acceptance criteria 明確要求的功能，不加入推測性的後端、帳號、地圖 SDK 或雲端整合。
- 優先使用小型純函式處理 Markdown parsing、時間計算與 Google Maps URL。
- 所有狀態變更必須能以 reducer action 重現並可測試。
- 拖曳操作必須保留鍵盤或按鈕替代方式。

## 驗證

- 完成 task 前必須執行與該 task 對應的測試。
- feature 完成前必須通過 `npm test`、`npm run build` 與 Playwright smoke test。
- 不可透過刪除或弱化測試來讓驗證通過。
