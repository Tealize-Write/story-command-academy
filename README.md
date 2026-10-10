# 字命學院【創作特質測驗】

> A psychological quiz web app that classifies users into creative academies based on their writing/creative style.

---

## 專案簡介

「字命學院」是一個純前端心理測驗網站，透過兩階段題目分析使用者的創作特質，最終分配至五個學院之一（紅、綠、藍、黑、白），並呈現各項分數光譜。

---

## 功能

- **兩階段測驗**
  - 第一階段：20 道共鳴強度題
  - 第二階段：10 道情境選擇題
- **結果頁**：顯示分配學院與各維度分數
- **統計頁**（`stats.html`）：圓餅圖呈現全員學院分佈
- **進度保存**：重新開啟可繼續測驗，支援返回改答與完成前確認

## 本機開發與驗證

使用 Node.js 20 以上版本：

```sh
npm ci
npx playwright install chromium
npm test
```

Windows 的瀏覽器測試預設使用已安裝的 Microsoft Edge；其他系統使用 Playwright Chromium。可用 `BROWSER_EXECUTABLE` 指定瀏覽器執行檔。

純前端可直接以本機 HTTP 伺服器預覽。`js/config.js` 使用 `js/config.example.js` 作範本；未設定正式 GAS 網址時仍可作答，行為紀錄與全體統計不會連接。

## 發布

GitHub Pages 部署會先執行測試，再以 GitHub Secret `GAS_URL` 產生設定。網址須為公開部署的 Google Apps Script `/exec` 端點；缺少設定時部署會停止。

```sh
# 將 GAS_URL 設定為環境變數後執行
npm run build
```

網站輸出至 `.tmp/site`，發布內容只包含網站頁面與執行所需的資源。GAS 程式部署是獨立步驟，不會由 Pages 工作流程更新；本機沒有 GAS 原始檔時，後端契約測試會略過，不能視為後端驗證通過。
