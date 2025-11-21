// public/js/chatbot.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatForm');
  const chatBox = document.getElementById('chatMessages');
  const input = document.getElementById('userInput');
  const recommendationEl = document.getElementById('recommendation');

  if (!form || !chatBox || !input) return;

 const emotionEmojis = {
  admiration: "✨",
  amusement: "😄",
  anger: "😡",
  annoyance: "😤",
  approval: "👍",
  caring: "🤗",
  confusion: "😕",
  curiosity: "🤔",
  desire: "❤️",
  disappointment: "😞",
  disapproval: "👎",
  disgust: "🤢",
  embarrassment: "😳",
  excitement: "🤩",
  fear: "😨",
  gratitude: "🙏",
  grief: "💔",
  joy: "😊",
  love: "❤️",
  nervousness: "😬",
  optimism: "🌟",
  pride: "😌",
  realization: "💡",
  relief: "😌",
  remorse: "😣",
  sadness: "😢",
  surprise: "😲",
  neutral: "😐"
};


  // 🧩 Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    // Append user message immediately
    appendMessage(message, 'user');
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Typing indicator
    const typingEl = appendMessage('MindHaven is thinking...', 'bot typing');

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId: window.USER_ID }) // send logged-in userId
      });

      const data = await res.json();
      typingEl.remove();

      const emotion = data.emotion ? data.emotion.toLowerCase() : 'neutral';
      const emoji = emotionEmojis[emotion] || '🤖';
      const reply = data.reply || 'Sorry, I didn’t quite catch that.';

    appendMessage(`${emoji} ${escapeHtml(reply)}`, 'bot');

      // Show recommendation if available
      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }

      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
      typingEl.remove();
      appendMessage(`⚠️ Sorry — something went wrong. (${escapeHtml(err.message)})`, 'bot');
    }
  });

  // 💬 Append a message to the chat box
  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = sender.includes('bot') ? 'bot-msg' : 'user-msg';
    if (sender.includes('typing')) msg.classList.add('typing');
    msg.innerHTML = escapeHtmlExceptTags(text);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  // ✨ Escape HTML but keep some allowed tags
  function escapeHtmlExceptTags(s = '') {
    return s.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // 🧹 Basic escape
  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Optional: theme toggle
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
    });
  }
});
