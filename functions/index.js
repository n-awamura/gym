// v2ではなくv1を使用する
const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");
const cors = require("cors");

// ✅ CORSミドルウェアを追加（GitHub Pagesからのアクセス許可）
const app = express();
app.use(cors({origin: true})); // ← GitHub Pagesなどどこからでも許可

app.use(express.json());

// ✅ 環境変数から Gemini APIキーを取得
const geminiApiKey = functions.config().gemini.api_key;
console.log("GEMINI_API_KEY:", geminiApiKey);

// 確認用GET
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// POST: Gemini API 呼び出し
// app.post 内を修正
app.post("/", async (req, res) => {
  console.info("callGemini triggered"); // ← logger.info → console.info に変更

  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({error: "Prompt is required"});
  }

  try {
    const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{parts: [{text: prompt}]}],
        },
    );

    let result = "不明";
    if (
      geminiRes.data &&
        geminiRes.data.candidates &&
        geminiRes.data.candidates[0] &&
        geminiRes.data.candidates[0].content &&
        geminiRes.data.candidates[0].content.parts &&
        geminiRes.data.candidates[0].content.parts[0]
    ) {
      result = geminiRes.data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({result});
  } catch (err) {
    console.error("Gemini API Error:", err); // ← logger.error → console.error
    return res.status(500).json({error: "Gemini API call failed"});
  }
});


// ✅ Cloud Functionsとしてエクスポート
exports.callGemini = functions.https.onRequest(app);
