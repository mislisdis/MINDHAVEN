// lightweight text cleaning pipeline
function preprocess(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\x00-\x7F]/g, ''); // remove non-ascii — adjust as needed
}

module.exports = { preprocess };
