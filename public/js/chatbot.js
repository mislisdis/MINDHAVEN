document.addEventListener('DOMContentLoaded', () => {
  const chatListEl = document.querySelector('.chat-list');
  const chatBox = document.getElementById('chatMessages');
  const input = document.getElementById('userInput');
  const form = document.getElementById('chatForm');
  const recommendationEl = document.getElementById('recommendation');
  const newChatBtn = document.querySelector('.new-chat-btn');

  if (!chatListEl || !chatBox || !input || !form) return;

  const emotionEmojis = {
    admiration: "✨", amusement: "😄", anger: "😡", annoyance: "😤",
    approval: "👍", caring: "🤗", confusion: "😕", curiosity: "🤔",
    desire: "❤️", disappointment: "😞", disapproval: "👎", disgust: "🤢",
    embarrassment: "😳", excitement: "🤩", fear: "😨", gratitude: "🙏",
    grief: "💔", joy: "😊", love: "❤️", nervousness: "😬",
    optimism: "🌟", pride: "😌", realization: "💡", relief: "😌",
    remorse: "😣", sadness: "😢", surprise: "😲", neutral: "😐"
  };

  let currentChatId = null;

  // --- Render a message ---
  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = sender.includes('bot') ? 'bot-msg' : 'user-msg';
    if (sender.includes('typing')) msg.classList.add('typing');

    if (sender.includes('user')) msg.textContent = text;
    else msg.innerHTML = text;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[m]);
  }

  // --- Load chat messages from backend ---
  async function loadChat(chatId) {
    currentChatId = chatId;
    chatBox.innerHTML = '';
    recommendationEl.innerHTML = '';

    try {
      const res = await fetch(`/api/chatbot/chat/${chatId}`);
      const data = await res.json();
      data.messages.forEach(m => {
        const emoji = emotionEmojis[(m.emotion || 'neutral').toLowerCase()] || '🤖';
        appendMessage(m.sender === 'user' ? m.text : `${emoji} ${m.text}`, m.sender);
      });
      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }
    } catch (err) {
      appendMessage(`⚠️ Failed to load chat. (${escapeHtml(err.message)})`, 'bot');
    }
  }

  // --- Add new chat to sidebar ---
  function addChatToSidebar(name, id) {
    const li = document.createElement('li');
    li.textContent = name;
    li.dataset.chatId = id;
    li.addEventListener('click', () => loadChat(id));
    chatListEl.appendChild(li);
  }

  // --- Handle new chat button ---
  if (newChatBtn) {
    newChatBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/chatbot/new', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId: window.USER_ID})
        });
        const data = await res.json();
        addChatToSidebar('New Chat', data.chatId);
        loadChat(data.chatId);
      } catch (err) {
        appendMessage(`⚠️ Could not create new chat. (${escapeHtml(err.message)})`, 'bot');
      }
    });
  }

  // --- Send message ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || !currentChatId) return;

    appendMessage(message, 'user');
    input.value = '';
    const typingEl = appendMessage('MindHaven is thinking...', 'bot typing');

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message, userId: window.USER_ID, chatId: currentChatId })
      });

      const data = await res.json();
      typingEl.remove();

      const emotion = (data.emotion || 'neutral').toLowerCase();
      const emoji = emotionEmojis[emotion] || '🤖';
      const reply = data.reply || 'Sorry, I didn’t quite catch that.';
      appendMessage(`${emoji} ${reply}`, 'bot');

      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }

    } catch (err) {
      typingEl.remove();
      appendMessage(`⚠️ Sorry — something went wrong. (${escapeHtml(err.message)})`, 'bot');
    }
  });

  // --- Theme toggle ---
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
    });
  }

  // --- Initial load: fetch existing chats ---
  async function initSidebar() {
    try {
      const res = await fetch(`/api/chatbot/chats/${window.USER_ID}`);
      const chats = await res.json();
      chats.forEach(c => addChatToSidebar(c.name, c.chatId));
      if (chats.length) loadChat(chats[0].chatId); // auto-load first chat
    } catch (err) {
      appendMessage(`⚠️ Failed to load chats. (${escapeHtml(err.message)})`, 'bot');
    }
  }

  initSidebar();
});
