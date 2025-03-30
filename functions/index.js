const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

exports.callGemini = onRequest(async (req, res) => {
  logger.info("callGemini triggered");

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const prompt = req.body.prompt;

  if (!prompt) {
    return res.status(400).json({error: "Prompt is required"});
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{parts: [{text: prompt}]}],
        },
    );

    let result = "不明";
    if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates.length > 0 &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts &&
      geminiRes.data.candidates[0].content.parts.length > 0
    ) {
      result = geminiRes.data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({result});
  } catch (err) {
    logger.error("Gemini API Error:", err);
    return res.status(500).json({error: "Gemini API call failed"});
  }
});
