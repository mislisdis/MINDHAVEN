// src/modules/vectorMemory.js
const Memory = require('../models/Memory');

/**
 * Lightweight tokenization / keyword extraction
 * Removes very short words and common stopwords (small set).
 */
function tokenize(text) {
  if (!text) return [];
  const stopwords = new Set(['the','and','is','in','to','a','of','that','it','i','you','me','my','we','be','are']);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && !stopwords.has(s));
}

/**
 * Build a sparse vector object mapping term->count
 */
function buildTermCounts(tokens) {
  const counts = {};
  tokens.forEach(t => counts[t] = (counts[t] || 0) + 1);
  return counts;
}

/**
 * Cosine similarity for sparse term-count objects
 */
function cosineSim(aCounts, bCounts) {
  let dot = 0, aNorm = 0, bNorm = 0;
  for (const k in aCounts) {
    aNorm += aCounts[k] * aCounts[k];
    if (bCounts[k]) dot += aCounts[k] * bCounts[k];
  }
  for (const k in bCounts) bNorm += bCounts[k] * bCounts[k];
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

/**
 * Persist a new memory for a user.
 * summary: short textual summary (the "understanding")
 */
async function createMemory(userId, summary, meta = {}) {
  try {
    const tokens = tokenize(summary);
    const keywords = Array.from(new Set(tokens)).slice(0, 20);
    const vectorCounts = buildTermCounts(tokens);
    // We'll store the counts as an array of values in model.vector for quick fetch,
    // but also store keywords. For similarity, we'll fetch and reconstruct counts.
    const doc = new Memory({ userId, summary, keywords, vector: [], meta });
    await doc.save();
    // store vector counts in meta to preserve counts (as object) - small hack to avoid storing large vectors
    doc.meta._counts = vectorCounts;
    await doc.save();
    return doc;
  } catch (err) {
    console.error("VectorMemory.createMemory error:", err.message);
    throw err;
  }
}

/**
 * Query similar memories for a user based on queryText.
 * returns topK matching Memory docs with similarity score.
 */
async function queryMemory(userId, queryText, topK = 3) {
  try {
    const tokens = tokenize(queryText);
    const qCounts = buildTermCounts(tokens);

    // fetch user's memories
    const mems = await Memory.find({ userId }).sort({ createdAt: -1 }).limit(200);
    const scored = [];

    mems.forEach(m => {
      // reconstruct counts from meta._counts or build from summary
      const mCounts = (m.meta && m.meta._counts) ? m.meta._counts : buildTermCounts(tokenize(m.summary));
      const sim = cosineSim(qCounts, mCounts);
      if (sim > 0) scored.push({ mem: m, score: sim });
    });

    scored.sort((a,b) => b.score - a.score);
    return scored.slice(0, topK).map(s => ({ memory: s.mem, score: s.score }));
  } catch (err) {
    console.error("VectorMemory.queryMemory error:", err.message);
    return [];
  }
}

module.exports = {
  createMemory,
  queryMemory
};
