document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const chatBox = document.getElementById('chat-box');

  if (!form || !chatBox) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    chatBox.innerHTML += `<div class="user-msg">${escapeHtml(message)}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      chatBox.innerHTML += `<div class="bot-msg">${escapeHtml(data.reply)} <span class="emotion-tag">(${escapeHtml(data.emotion)})</span></div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
      chatBox.innerHTML += `<div class="bot-msg">Sorry — something went wrong. (${err.message})</div>`;
    }
  });

  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }
});
