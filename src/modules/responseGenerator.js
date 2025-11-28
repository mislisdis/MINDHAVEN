// src/modules/responseGenerator.js
const fs = require("fs");
const path = require("path");
const openai = require("./openaiClient");
const { checkForCrisis } = require("./safetyFilter");
const { getQuestions } = require("./therapeuticQuestioner");

// -------------------- Load Intents --------------------
let intents = null;
try {
  const p = path.join(__dirname, "../../data/intents.json");
  if (fs.existsSync(p)) {
    intents = JSON.parse(fs.readFileSync(p, "utf8"));
    console.log("✅ Loaded intents.json");
  }
} catch (e) {
  console.error("❌ Failed to load intents.json", e);
}

// -------------------- Load Resource Library --------------------
let resourceLibrary = {};
try {
  const rp = path.join(__dirname, "../../data/resources.json");
  if (fs.existsSync(rp)) {
    resourceLibrary = JSON.parse(fs.readFileSync(rp, "utf8"));
    console.log("✅ Loaded resources.json");
  }
} catch (e) {
  console.error("❌ Failed to load resources.json", e);
}

// -------------------- Helpers --------------------
function pickIntent(emotion) {
  if (!intents || !intents[emotion]) return null;
  const arr = intents[emotion];
  return arr[Math.floor(Math.random() * arr.length)];
}

function soften(text) {
  const soft = [
    " I'm here with you.",
    " You don’t have to go through this alone.",
    " If you want, we can talk through it together.",
  ];
  return text + soft[Math.floor(Math.random() * soft.length)];
}

function summarizeContext(messages) {
  if (!messages) return "";
  const recent = messages
    .slice(-4)
    .map(m => m.trim())
    .filter(Boolean)
    .map(msg => (msg.length > 50 ? msg.slice(0, 50) + "..." : msg));
  return recent.join(" | ");
}

// -------------------- Emotion Memory --------------------
let emotionMemory = [];

function updateEmotionMemory(emotion) {
  if (!emotion) return;
  emotionMemory.push(emotion.toLowerCase());
  if (emotionMemory.length > 5) emotionMemory.shift();
}

function summarizeEmotions() {
  if (emotionMemory.length === 0) return "";
  const counts = {};
  emotionMemory.forEach(e => (counts[e] = (counts[e] || 0) + 1));
  return Object.entries(counts)
    .map(([e, c]) => `${e}(${c})`)
    .join(", ");
}

// -------------------- Natural Conversational Cues --------------------
function cues(message) {
  const msg = message.toLowerCase();
  if (/^(hi|hey|hello|good morning|good evening)\b/.test(msg))
    return "Hey! How are you feeling today?";
  if (/(thank you|thanks|thx)/.test(msg))
    return "You're welcome. How are you feeling now?";
  if (/(bye|goodbye|see you)/.test(msg))
    return "Goodbye! Take care — you can talk to me anytime.";
  return null;
}

// -------------------- Crisis Response --------------------
function crisisReply() {
  return {
    reply:
      "I'm really glad you said something. What you're feeling is serious, and you deserve real support.\n\n" +
      "📞 Kenya Red Cross Hotline: 1199\n" +
      "💛 Befrienders Kenya: 0722 178 177\n\n" +
      "You’re not alone — I’m here with you.",
    meta: { severity: "high", tone: "calm" },
  };
}

// -------------------- Resource Suggestion --------------------
function maybeSuggestResources(emotion) {
  // For some moods, randomly decide whether to attach resources
  const chance = 0.3; // 30% of appropriate times
  if (Math.random() > chance) return null;

  const list = resourceLibrary[emotion] || resourceLibrary["neutral"] || [];
  if (!list.length) return null;

  // pick 1 or 2 resources
  const shuffled = list.sort(() => 0.5 - Math.random());
  const picks = shuffled.slice(0, Math.min(2, list.length));
  return picks;
}

// -------------------- Fallback --------------------
function fallback(emotion, rawMessage) {
  const emotionalSupport = {
    sadness: "I hear you — that sounds really heavy.",
    anxiety: "I understand — that must feel overwhelming.",
    anger: "It’s okay to feel upset about that.",
    fear: "That sounds unsettling. It’s okay to feel that way.",
  };

  let reply = emotionalSupport[emotion] || pickIntent(emotion) || "I’m here with you. Tell me more if you want.";

  if (!emotionalSupport[emotion]) {
    const q = getQuestions(emotion, "low", rawMessage);
    if (q && q[0]) reply += " " + q[0];
  }

  const resources = maybeSuggestResources(emotion);
  if (resources) {
    reply += "\n\nIf you like, you might find these helpful:\n";
    resources.forEach(r => {
      reply += `- ${r.title}: ${r.url}\n`;
    });
  }

  return { reply: soften(reply), meta: { tone: "warm", severity: "low" } };
}

// -------------------- Main Response Generator --------------------
async function generateResponse(rawEmotion, conversationContext, longTerm, opts = {}) {
  const rawMsg = (opts.rawMessage || "").trim();

  const { level } = checkForCrisis(rawMsg);
  if (level === 2) return crisisReply();
  if (level === 1) {
    return {
      reply: "I hear you — that sounds really difficult. Do you want to tell me more about what you're feeling?",
      meta: { severity: "medium", tone: "warm" },
    };
  }

  const cue = cues(rawMsg);
  if (cue) return { reply: cue, meta: { tone: "friendly", severity: "low" } };

  let emotion = "neutral";
  if (typeof rawEmotion === "string") emotion = rawEmotion;
  if (rawEmotion && rawEmotion.emotion) emotion = rawEmotion.emotion;
  emotion = emotion.toLowerCase();

  updateEmotionMemory(emotion);

  const contextSummary = summarizeContext(conversationContext);
  const emotionSummary = summarizeEmotions();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a warm, empathetic mental‑health chatbot. Respond naturally, acknowledge emotions, and offer gentle support. " +
            "Reference context and recent emotions subtly if helpful. Never repeat user's exact messages verbatim."
        },
        contextSummary
          ? { role: "system", content: `Key conversation points: ${contextSummary}` }
          : null,
        emotionSummary
          ? { role: "system", content: `User’s recent emotional states: ${emotionSummary}` }
          : null,
        { role: "user", content: rawMsg },
      ].filter(Boolean),
      temperature: 0.7,
      max_tokens: 200,
    });

    let reply = completion.choices[0].message.content.trim();

    // Optionally add resources
    const resources = maybeSuggestResources(emotion);
    if (resources) {
      reply += "\n\nYou might find these helpful:";
      resources.forEach(r => {
        reply += `\n- ${r.title}: ${r.url}`;
      });
    }

    return { reply: soften(reply), meta: { severity: "low", tone: "warm" } };
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return fallback(emotion, rawMsg);
  }
}

module.exports = generateResponse;
