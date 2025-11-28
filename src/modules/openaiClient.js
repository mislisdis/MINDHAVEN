// src/modules/openaiClient.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // <-- make sure this is set in your env
});

module.exports = client;
