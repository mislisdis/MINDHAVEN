document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatMessages');
  const input = document.getElementById('userInput');
  const form = document.getElementById('chatForm');
  const sidebar = document.getElementById('chatList');
  const recommendationEl = document.getElementById('recommendation');
  const newChatBtn = document.getElementById('newChatBtn');
  let currentChatId = null;

  const emotionEmojis = {
    admiration: "✨", amusement: "😄", anger: "😡", annoyance: "😤", approval: "👍",
    caring: "🤗", confusion: "😕", curiosity: "🤔", desire: "❤️", disappointment: "😞",
    disapproval: "👎", disgust: "🤢", embarrassment: "😳", excitement: "🤩", fear: "😨",
    gratitude: "🙏", grief: "💔", joy: "😊", love: "❤️", nervousness: "😬",
    optimism: "🌟", pride: "😌", realization: "💡", relief: "😌", remorse: "😣",
    sadness: "😢", surprise: "😲", neutral: "😐"
  };

  // --- Load sidebar chats ---
  async function loadChats() {
    try {
      const res = await fetch('/api/chats', { credentials: 'include' });
      const chats = await res.json();
      sidebar.innerHTML = '';
      if (chats.length === 0) {
        sidebar.innerHTML = '<p class="text-muted">No chats yet. Click + New Chat to start.</p>';
      }
      chats.forEach(chat => {
        const el = document.createElement('div');
        el.className = 'chat-item';
        el.textContent = chat.title || 'Untitled Chat';
        el.dataset.id = chat._id;
        el.addEventListener('click', () => openChat(chat._id));
        sidebar.appendChild(el);
      });
    } catch (err) {
      sidebar.innerHTML = '⚠️ Failed to load chats.';
      console.error(err);
    }
  }

  // --- Open chat ---
  async function openChat(chatId) {
    currentChatId = chatId;
    chatBox.innerHTML = '<p class="text-muted">Loading messages...</p>';
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { credentials: 'include' });
      const messages = await res.json();
      chatBox.innerHTML = '';
      if (messages.length === 0) {
        appendMessage("What's on your mind today?", 'bot', 'neutral');
      } else {
        messages.forEach(msg => appendMessage(msg.text, msg.sender, msg.emotion));
      }
    } catch (err) {
      chatBox.innerHTML = '⚠️ Failed to load messages.';
      console.error(err);
    }
  }

  // --- Create new chat ---
  newChatBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/chats/new', {
        method: 'POST',
        credentials: 'include',
      });
      const chat = await res.json();
      await loadChats();
      openChat(chat._id);
    } catch (err) {
      alert('⚠️ Could not create new chat.');
      console.error(err);
    }
  });

  // --- Submit message ---
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentChatId) return alert('Select or create a chat first.');

    const message = input.value.trim();
    if (!message) return;
    appendMessage(message, 'user');
    input.value = '';

    const typingEl = appendMessage('MindHaven is thinking...', 'bot typing');

    try {
      // Bot reply
      const res = await fetch(`/api/chats/${currentChatId}/botMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, userId: window.USER_ID })
      });
      const data = await res.json();
      typingEl.remove();

      const emoji = emotionEmojis[data.emotion?.toLowerCase()] || '🤖';
      appendMessage(`${emoji} ${data.reply}`, 'bot');

      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }

      // Save user message
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          chatId: currentChatId,
          sender: 'user',
          text: message
        })
      });

      // Save bot message
      await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          chatId: currentChatId,
          sender: 'bot',
          text: `${emoji} ${data.reply}`,
          emotion: data.emotion
        })
      });

    } catch (err) {
      typingEl.remove();
      appendMessage(`⚠️ Something went wrong (${err.message})`, 'bot');
      console.error(err);
    }
  });

  // --- Append message ---
  function appendMessage(text, sender, emotion) {
    const msg = document.createElement('div');
    msg.className = sender.includes('bot') ? 'bot-msg' : 'user-msg';
    if (sender.includes('typing')) msg.classList.add('typing');
    msg.innerHTML = sender === 'user' ? escapeHtml(text) : text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }

  // --- Theme toggle (initialize + persist) ---
  (function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Apply saved theme (if any)
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    const darkStylesheet = document.getElementById('darkThemeStylesheet');
    document.body.classList.toggle('dark-theme', isDark);
    if (darkStylesheet) darkStylesheet.disabled = !isDark;
    themeToggle.checked = isDark;

    // Listen for changes and persist
    themeToggle.addEventListener('change', () => {
      const nowDark = themeToggle.checked;
      document.body.classList.toggle('dark-theme', nowDark);
      if (darkStylesheet) darkStylesheet.disabled = !nowDark;
      try { localStorage.setItem('theme', nowDark ? 'dark' : 'light'); } catch (e) { /* ignore storage errors */ }
    });
  })();

  // Load chats on page load
  loadChats();
});
