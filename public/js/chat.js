document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chatMessages");
  const input = document.getElementById("userInput");
  const form = document.getElementById("chatForm");
  const sidebar = document.getElementById("chatList");
  const recommendationEl = document.getElementById("recommendation");
  const newChatBtn = document.getElementById("newChatBtn");
  const micBtn = document.getElementById("startRecording");
  let currentChatId = null;

  /* ------------------------------
        EMOTION → EMOJI
  ------------------------------ */
  const emotionEmojis = {
    admiration: "✨", amusement: "😄", anger: "😡", annoyance: "😤", approval: "👍",
    caring: "🤗", confusion: "😕", curiosity: "🤔", desire: "❤️", disappointment: "😞",
    disapproval: "👎", disgust: "🤢", embarrassment: "😳", excitement: "🤩", fear: "😨",
    gratitude: "🙏", grief: "💔", joy: "😊", love: "❤️", nervousness: "😬",
    optimism: "🌟", pride: "😌", realization: "💡", relief: "😌", remorse: "😣",
    sadness: "😢", surprise: "😲", neutral: "😐"
  };

  /* ------------------------------
        LOAD CHATS
  ------------------------------ */
  async function loadChats() {
    try {
      const res = await fetch("/api/chats", { credentials: "include" });
      const chats = await res.json();
      sidebar.innerHTML = "";

      if (chats.length === 0) {
        sidebar.innerHTML = `<p class="text-muted">No chats yet. Click + New Chat to start.</p>`;
        return;
      }

      chats.forEach(chat => {
        const el = document.createElement("div");
        el.className = "chat-item";
        el.dataset.id = chat._id;

        el.innerHTML = `
          <span class="chat-title">${escapeHtml(chat.title || "Untitled Chat")}</span>
          <button class="rename-btn">✏️</button>
          <button class="delete-btn">🗑️</button>
        `;

        // Open chat on title click
        el.querySelector(".chat-title").addEventListener("click", () => openChat(chat._id));

        // Rename chat
        el.querySelector(".rename-btn").addEventListener("click", async () => {
          const newTitle = prompt("Enter new chat title:", chat.title);
          if (!newTitle) return;

          try {
            const res = await fetch(`/api/chats/${chat._id}`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: newTitle }),
            });
            const data = await res.json();
            if (res.ok) {
              loadChats();
              if (currentChatId === chat._id) highlightActiveChat(chat._id);
            } else {
              alert(data.message || "Rename failed");
            }
          } catch (err) {
            console.error(err);
            alert("Error renaming chat");
          }
        });

        // Delete chat
        el.querySelector(".delete-btn").addEventListener("click", async () => {
          if (!confirm("Are you sure you want to delete this chat?")) return;

          try {
            const res = await fetch(`/api/chats/${chat._id}`, {
              method: "DELETE",
              credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
              if (currentChatId === chat._id) {
                chatBox.innerHTML = "";
                currentChatId = null;
              }
              loadChats();
            } else {
              alert(data.message || "Delete failed");
            }
          } catch (err) {
            console.error(err);
            alert("Error deleting chat");
          }
        });

        sidebar.appendChild(el);
      });
    } catch (err) {
      sidebar.innerHTML = "⚠️ Failed to load chats.";
      console.error(err);
    }
  }

  /* ------------------------------
      OPEN CHAT + MESSAGES
------------------------------ */
  async function openChat(chatId) {
    currentChatId = chatId;
    highlightActiveChat(chatId);

    chatBox.innerHTML = `<p class="text-muted">Loading messages...</p>`;

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { credentials: "include" });
      const messages = await res.json();

      chatBox.innerHTML = ""; // clear previous messages

      if (!messages || messages.length === 0) {
        // Only show placeholder if no messages exist at all
        appendMessage("What's on your mind today?", "bot");
        return;
      }

      // Append all messages exactly as they are in DB
      messages.forEach(msg => {
        const sender = msg.sender === "bot" ? "bot" : "user";
        appendMessage(msg.text, sender);
      });
    } catch (err) {
      chatBox.innerHTML = "⚠️ Failed to load messages.";
      console.error(err);
    }
  }

  function highlightActiveChat(chatId) {
    document.querySelectorAll(".chat-item").forEach(item => item.classList.remove("active"));
    const activeChat = document.querySelector(`.chat-item[data-id="${chatId}"]`);
    if (activeChat) activeChat.classList.add("active");
  }

  /* ------------------------------
        CREATE NEW CHAT
  ------------------------------ */
  newChatBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/chats/new", { method: "POST", credentials: "include" });
      const chat = await res.json();
      await loadChats();
      await openChat(chat._id);
    } catch (err) {
      alert("⚠️ Could not create new chat.");
      console.error(err);
    }
  });

  /* ------------------------------
      APPEND MESSAGE
------------------------------ */
  function appendMessage(text, sender, isTyping = false) {
    const div = document.createElement("div");

    if (sender === "user") {
      div.className = "message user-msg";  // user → right
    } else {
      div.className = "message bot-msg";   // bot → left
    }

    if (isTyping) div.classList.add("typing");  // special class for typing

    div.innerHTML = escapeHtml(text);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
  }

  /* ------------------------------
      SEND MESSAGE
------------------------------ */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!currentChatId) return alert("Please select or create a chat first.");

    const message = input.value.trim();
    if (!message) return;

    appendMessage(message, "user");
    input.value = "";

    // Append typing indicator on the left
    const typingEl = appendMessage("MindHaven is thinking...", "bot", true);

    try {
      const res = await fetch(`/api/chats/${currentChatId}/botMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      typingEl.remove(); // remove typing once bot reply is received

      const emoji = emotionEmojis[data.emotion?.toLowerCase()] || "🤖";
      appendMessage(`${emoji} ${data.reply}`, "bot");

      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }

      // Save user message
      await fetch("/api/chats/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat: currentChatId, sender: "user", text: message }),
      });

      // Save bot message
      await fetch("/api/chats/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat: currentChatId, sender: "bot", text: `${emoji} ${data.reply}`, emotion: data.emotion }),
      });

    } catch (err) {
      typingEl.remove();
      appendMessage("⚠️ Error: " + err.message, "bot");
      console.error(err);
    }
  });

  /* ------------------------------
        ESCAPE HTML
  ------------------------------ */
  function escapeHtml(str = "") {
    return str.replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  /* ------------------------------
        VOICE-TO-TEXT
  ------------------------------ */
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      input.value = transcript;
    };

    recognition.onstart = () => micBtn.innerText = "🎙️";
    recognition.onend = () => micBtn.innerText = "🎤";
    recognition.onerror = (e) => console.error("Voice error:", e.error);

    micBtn.addEventListener("click", () => recognition.start());
  } else {
    micBtn.disabled = true;
    micBtn.title = "Speech recognition not supported";
  }

  /* ------------------------------
        THEME TOGGLE
  ------------------------------ */
  (function initTheme() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    const darkStylesheet = document.getElementById("darkThemeStylesheet");

    document.body.classList.toggle("dark-theme", isDark);
    if (darkStylesheet) darkStylesheet.disabled = !isDark;
    toggle.checked = isDark;

    toggle.addEventListener("change", () => {
      const nowDark = toggle.checked;
      document.body.classList.toggle("dark-theme", nowDark);
      if (darkStylesheet) darkStylesheet.disabled = !nowDark;
      localStorage.setItem("theme", nowDark ? "dark" : "light");
    });
  })();

  // Initial load
  loadChats();
});
