# Travel Place Suggestions Fixture

這是 project-local `travel-place-suggestions` skill 的格式 fixture，不是旅程資料，也不會被 app 匯入。

## Input

> 東京淺草附近，想找歷史景點和適合散步的地方。請先列候選，我確認後再輸出 Markdown。

## Expected discovery behavior

先列出候選清單，每個候選包含景點名稱、地圖搜尋文字、推薦理由與實際查閱的官方／查證來源；不要在這一步輸出備案 block，也不要修改旅程檔案。

## User confirmation

> 選 1 和 3，順序照這個選擇；沒有特別指定停留時間。

## Expected export shape

預期回應包含一個只放 list items 的 fenced Markdown block。每個景點預設 60 分鐘，順序為 1 再 3：

````md
- 候選 1 | 候選 1 的可搜尋名稱或官方地址 | 60 | 
- 候選 3 | 候選 3 的可搜尋名稱或官方地址 | 60 | 
````

實際景點名稱與地圖文字必須來自當次查證結果；fixture 中的「候選 1／3」只是格式佔位符，不可當成真實景點資料。
