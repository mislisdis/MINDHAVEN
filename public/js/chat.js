// public/js/chat.js - FULLY UPDATED VERSION
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Chat.js loaded - Enhanced version");
  
  const chatBox = document.getElementById("chatMessages");
  const input = document.getElementById("userInput");
  const form = document.getElementById("chatForm");
  const sidebar = document.getElementById("chatList");
  const recommendationEl = document.getElementById("recommendation");
  const newChatBtn = document.getElementById("newChatBtn");
  const micBtn = document.getElementById("startRecording");
  const logoutBtn = document.querySelector('.logout-btn');
  let currentChatId = null;
  let isProcessing = false;

  // If core chat elements aren't present (e.g., on non-chat pages), skip init
  const missing = Object.entries({ chatBox, input, form, sidebar })
    .filter(([, el]) => !el)
    .map(([key]) => key);
  if (missing.length) {
    console.warn(`chat.js: missing DOM nodes (${missing.join(", ")}); skipping init on this page.`);
    return;
  }

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
        AUTO-INITIALIZE CHAT SYSTEM
  ------------------------------ */
  async function initializeChatSystem() {
    console.log("🔍 Initializing chat system...");
    
    try {
      // First, check if user is authenticated
      const healthCheck = await fetch("/api/chats", { 
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      });
      
      if (!healthCheck.ok && healthCheck.status === 401) {
        console.log("🔒 User not authenticated, redirecting to login");
        window.location.href = "/login";
        return;
      }
      
      // Load existing chats
      await loadChats();
      
      // Check if we have any chats
      const chatItems = document.querySelectorAll('.chat-item');
      
      if (chatItems.length === 0) {
        console.log("📝 No chats found, creating new one...");
        await createAndOpenNewChat();
      } else {
        // Open the most recent chat (first in list)
        const firstChat = chatItems[0];
        const chatId = firstChat.dataset.id;
        console.log("🔓 Opening most recent chat:", chatId);
        await openChat(chatId);
      }
      
      console.log("✅ Chat system initialized successfully");
    } catch (error) {
      console.error("❌ Chat system initialization failed:", error);
      showErrorMessage("Failed to initialize chat. Please refresh the page.");
    }
  }

  /* ------------------------------
        CREATE AND OPEN NEW CHAT
  ------------------------------ */
  async function createAndOpenNewChat() {
    try {
      console.log("🆕 Creating new chat...");
      
      const res = await fetch("/api/chats/new", { 
        method: "POST", 
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const chat = await res.json();
      console.log("✅ Created new chat:", chat._id);

      // Ensure default title if missing
      try {
        if (!chat.title || chat.title.trim() === '') {
          await fetch(`/api/chats/${chat._id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New chat' })
          });
        }
      } catch (e) {
        console.warn('⚠️ Failed to set default chat title:', e.message);
      }
      
      // Reload chats list
      await loadChats();
      
      // Open the new chat
      await openChat(chat._id);
      
      return chat._id;
    } catch (error) {
      console.error("❌ Failed to create new chat:", error);
      throw error;
    }
  }

  /* ------------------------------
        LOAD CHATS
  ------------------------------ */
  async function loadChats() {
    console.log("📂 Loading chats...");
    
    try {
      const res = await fetch("/api/chats", { 
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const chats = await res.json();
      sidebar.innerHTML = "";

      // Helper to close all open menus
      function closeAllMenus() {
        document.querySelectorAll('.chat-menu-dropdown').forEach(dd => dd.setAttribute('hidden', ''));
        document.querySelectorAll('.chat-menu-btn[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
      }

      if (!chats || chats.length === 0) {
        sidebar.innerHTML = `
          <p class="text-muted" style="padding: 20px; text-align: center;">
            No chats yet. Click + New Chat to start.
          </p>
        `;
        return;
      }

      chats.forEach(chat => {
        const el = document.createElement("div");
        el.className = "chat-item";
        el.dataset.id = chat._id;

        const displayTitle = chat.title && chat.title.trim() !== '' ? chat.title : 'New chat';
        el.innerHTML = `
          <span class="chat-title">${escapeHtml(displayTitle)}</span>
          <div class="chat-actions">
            <button class="chat-menu-btn" aria-haspopup="true" aria-expanded="false" title="More options">⋮</button>
            <div class="chat-menu-dropdown" hidden>
              <button class="chat-rename">Rename</button>
              <button class="chat-delete">Delete</button>
            </div>
          </div>
        `;

        // Open chat on title click
        el.querySelector(".chat-title").addEventListener("click", () => openChat(chat._id));

        // Open chat on entire item click (except menu area)
        el.addEventListener("click", (e) => {
          if (!e.target.closest('.chat-actions')) {
            openChat(chat._id);
          }
        });

        // Kebab menu toggle
        const menuBtn = el.querySelector('.chat-menu-btn');
        const menuDropdown = el.querySelector('.chat-menu-dropdown');
        // Style the actions container & menu for popup behavior
        const actionsDiv = el.querySelector('.chat-actions');
        if (actionsDiv) actionsDiv.style.position = 'relative';
        if (menuBtn) menuBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:16px;line-height:1;padding:0 6px;';
        if (menuDropdown) menuDropdown.style.cssText = 'position:absolute;right:0;top:24px;background:var(--panel, #fff);color:inherit;border:1px solid rgba(0,0,0,0.08);border-radius:6px;min-width:140px;box-shadow:0 6px 20px rgba(0,0,0,0.15);z-index:20;padding:4px;';
        menuDropdown?.querySelectorAll('button').forEach(b => {
          b.style.cssText = 'display:block;width:100%;padding:8px 12px;background:none;border:none;text-align:left;cursor:pointer;border-radius:4px;';
          b.addEventListener('mouseenter', () => b.style.background = 'rgba(0,0,0,0.06)');
          b.addEventListener('mouseleave', () => b.style.background = 'transparent');
        });
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
          closeAllMenus();
          if (!expanded) {
            menuBtn.setAttribute('aria-expanded', 'true');
            menuDropdown.removeAttribute('hidden');
          }
        });

        // Rename action
        el.querySelector('.chat-rename').addEventListener('click', async (e) => {
          e.stopPropagation();
          const current = displayTitle;
          const newTitle = prompt('Enter new chat title:', current);
          closeAllMenus();
          if (!newTitle || newTitle.trim() === '') return;
          try {
            const res = await fetch(`/api/chats/${chat._id}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTitle.trim() })
            });
            if (res.ok) {
              await loadChats();
              if (currentChatId === chat._id) highlightActiveChat(chat._id);
            } else {
              const data = await res.json().catch(() => ({}));
              alert(data.message || 'Failed to rename chat');
            }
          } catch (err) {
            console.error('Rename error:', err);
            alert('Error renaming chat');
          }
        });

        // Delete action
        el.querySelector('.chat-delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          closeAllMenus();
          if (!confirm('Are you sure you want to delete this chat? All messages will be lost.')) return;
          try {
            const res = await fetch(`/api/chats/${chat._id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            if (res.ok) {
              if (currentChatId === chat._id) {
                chatBox.innerHTML = '';
                currentChatId = null;
              }
              await loadChats();
              if (document.querySelectorAll('.chat-item').length === 0) {
                await createAndOpenNewChat();
              }
            } else {
              const data = await res.json().catch(() => ({}));
              alert(data.message || 'Failed to delete chat');
            }
          } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting chat');
          }
        });

        sidebar.appendChild(el);

        // Close menu when clicking outside
        document.addEventListener('click', (evt) => {
          if (!el.contains(evt.target)) {
            menuDropdown?.setAttribute('hidden', '');
            menuBtn?.setAttribute('aria-expanded', 'false');
          }
        });
      });
      
      console.log(`✅ Loaded ${chats.length} chats`);
    } catch (err) {
      console.error("❌ Failed to load chats:", err);
      sidebar.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <p>⚠️ Failed to load chats.</p>
          <button onclick="location.reload()" style="padding: 5px 10px; margin-top: 10px;">
            Retry
          </button>
        </div>
      `;
    }
  }

  /* ------------------------------
      OPEN CHAT + MESSAGES
------------------------------ */
  async function openChat(chatId) {
    console.log(`📖 Opening chat: ${chatId}`);
    
    if (!chatId) {
      console.error("❌ No chat ID provided");
      return;
    }
    
    currentChatId = chatId;
    highlightActiveChat(chatId);

    // Show loading state
    chatBox.innerHTML = `
      <div class="text-muted" style="text-align: center; padding: 40px;">
        <div class="spinner-border spinner-border-sm" role="status" style="margin-right: 10px;"></div>
        Loading messages...
      </div>
    `;

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { 
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const messages = await res.json();
      chatBox.innerHTML = ""; // Clear loading

      if (!messages || messages.length === 0) {
        // Show welcome message for empty chat
        appendMessage("What's on your mind today? I'm here to listen. 💛", "bot");
        return;
      }

      // Append all messages
      messages.forEach(msg => {
        const sender = msg.sender === "bot" ? "bot" : "user";
        appendMessage(msg.text, sender);
      });
      
      console.log(`✅ Loaded ${messages.length} messages`);
    } catch (err) {
      console.error("❌ Failed to load messages:", err);
      chatBox.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc3545;">
          <p>⚠️ Failed to load messages.</p>
          <button onclick="openChat('${chatId}')" style="padding: 5px 10px;">
            Retry
          </button>
        </div>
      `;
    }
  }

  function highlightActiveChat(chatId) {
    document.querySelectorAll(".chat-item").forEach(item => {
      item.classList.remove("active");
    });
    
    const activeChat = document.querySelector(`.chat-item[data-id="${chatId}"]`);
    if (activeChat) {
      activeChat.classList.add("active");
      console.log(`✅ Highlighted chat: ${chatId}`);
    }
  }

  /* ------------------------------
        CREATE NEW CHAT BUTTON
  ------------------------------ */
  if (newChatBtn) {
    newChatBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("➕ New chat button clicked");
      
      try {
        await createAndOpenNewChat();
      } catch (err) {
        alert("⚠️ Could not create new chat. Please try again.");
        console.error(err);
      }
    });
  }

  /* ------------------------------
      APPEND MESSAGE
------------------------------ */
  function appendMessage(text, sender, isTyping = false) {
    const div = document.createElement("div");

    if (sender === "user") {
      div.className = "message user-msg";
    } else {
      div.className = "message bot-msg";
    }

    if (isTyping) {
      div.classList.add("typing");
      div.style.fontStyle = "italic";
      div.style.opacity = "0.7";
    }

    // Preserve line breaks and basic formatting
    const formattedText = escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    div.innerHTML = formattedText;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return div;
  }

  /* ------------------------------
      SEND MESSAGE - ENHANCED
------------------------------ */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Prevent multiple simultaneous sends
    if (isProcessing) {
      console.log("⏳ Already processing a message, please wait...");
      return;
    }
    
    const message = input.value.trim();
    if (!message) {
      input.focus();
      return;
    }
    
    // If no current chat, create one automatically
    if (!currentChatId) {
      console.log("⚠️ No current chat, creating one automatically...");
      try {
        currentChatId = await createAndOpenNewChat();
        // Small delay to ensure chat is ready
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        alert("❌ Could not create a chat. Please try again.");
        console.error(err);
        return;
      }
    }
    
    // Clear input immediately
    input.value = "";
    input.focus();
    
    // Append user message
    appendMessage(message, "user");
    
    // Append typing indicator
    const typingEl = appendMessage("MindHaven is thinking...", "bot", true);
    
    // Set processing flag
    isProcessing = true;
    
    try {
      console.log(`📤 Sending message to chat ${currentChatId}:`, message.substring(0, 50));
      
      const res = await fetch(`/api/chats/${currentChatId}/botMessage`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        credentials: "include",
        body: JSON.stringify({ message }),
      });
      
      // Remove typing indicator
      typingEl.remove();
      
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      console.log("✅ Received bot response:", {
        emotion: data.emotion,
        hasResources: data.resources?.length > 0,
        replyLength: data.reply?.length
      });
      
      // Get appropriate emoji
      const emoji = emotionEmojis[data.emotion?.toLowerCase()] || "🤖";
      
      // Display bot response with emoji
      appendMessage(`${emoji} ${data.reply}`, "bot");
      
      // Display resources if available
      if (data.resources && data.resources.length > 0) {
        displayResources(data.resources);
      }
      
      // Update recommendation area
      if (data.recommendation) {
        recommendationEl.innerHTML = `<p>${escapeHtml(data.recommendation)}</p>`;
      }
      
      // Save user message to database
      await saveMessage(currentChatId, "user", message, null);
      
      // Save bot message to database
      await saveMessage(currentChatId, "bot", `${emoji} ${data.reply}`, data.emotion);
      
      // Save resource notification if resources were shown
      if (data.resources && data.resources.length > 0) {
        await saveMessage(
          currentChatId, 
          "bot", 
          `📚 I've shared ${data.resources.length} resource(s) that might be helpful.`,
          data.emotion
        );
      }
      
    } catch (err) {
      console.error("❌ Message sending error:", err);
      
      // Remove typing indicator if still present
      if (typingEl.parentNode) {
        typingEl.remove();
      }
      
      // Show user-friendly error
      appendMessage(`⚠️ Sorry, I encountered an error: ${err.message}`, "bot");
      
      // Try to save error message
      try {
        await saveMessage(
          currentChatId, 
          "bot", 
          `⚠️ Error: ${err.message}`, 
          "neutral"
        );
      } catch (saveErr) {
        console.error("Failed to save error message:", saveErr);
      }
    } finally {
      // Reset processing flag
      isProcessing = false;
    }
  });

  /* ------------------------------
      DISPLAY RESOURCES
  ------------------------------ */
  function displayResources(resources) {
    if (!resources || resources.length === 0) return;
    
    const resourceDiv = document.createElement('div');
    resourceDiv.className = 'message bot-msg resource-message';
    
    let resourceHTML = `
      <div class="resources-container">
        <div style="display: flex; align-items: center; margin-bottom: 10px; color: var(--secondary);">
          <span style="font-size: 1.2em; margin-right: 8px;">📚</span>
          <strong>Helpful Resources</strong>
        </div>
    `;
    
    resources.forEach((resource, index) => {
      resourceHTML += `
        <div class="resource-item" style="
          background: rgba(251, 133, 0, 0.08);
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
          border-left: 3px solid var(--secondary);
        ">
          <strong>${index + 1}. ${resource.title}</strong>`;
      
      if (resource.phone) {
        resourceHTML += `
          <div style="margin-top: 4px;">
            <span style="color: #666; font-size: 0.9em;">📞</span>
            <span style="font-family: monospace; margin-left: 5px; font-size: 0.95em;">
              ${resource.phone}
            </span>
          </div>`;
      }
      
      if (resource.url) {
        resourceHTML += `
          <div style="margin-top: 4px;">
            <a href="${resource.url}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="
                 color: var(--secondary);
                 text-decoration: none;
                 font-size: 0.9em;
                 display: inline-flex;
                 align-items: center;
               ">
              <span style="margin-right: 5px;">🔗</span>
              Visit Website
            </a>
          </div>`;
      }
      
      resourceHTML += `</div>`;
    });
    
    resourceHTML += `</div>`;
    resourceDiv.innerHTML = resourceHTML;
    chatBox.appendChild(resourceDiv);
  }

  /* ------------------------------
      SAVE MESSAGE TO DATABASE
  ------------------------------ */
  async function saveMessage(chatId, sender, text, emotion) {
    try {
      const res = await fetch("/api/chats/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat: chatId, 
          sender: sender, 
          text: text, 
          emotion: emotion 
        }),
      });
      
      if (!res.ok) {
        console.warn(`⚠️ Failed to save ${sender} message:`, await res.text());
      }
    } catch (err) {
      console.error(`❌ Error saving ${sender} message:`, err);
    }
  }

  /* ------------------------------
      ESCAPE HTML - ENHANCED
  ------------------------------ */
  function escapeHtml(str = "") {
    if (typeof str !== 'string') return '';
    
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    };
    
    return str.replace(/[&<>"'`]/g, match => htmlEntities[match]);
  }

  /* ------------------------------
      SHOW ERROR MESSAGE
  ------------------------------ */
  function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    errorDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 1.2em; cursor: pointer; margin-left: 10px;">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /* ------------------------------
      VOICE-TO-TEXT
  ------------------------------ */
  if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      micBtn.innerHTML = "🎙️ Listening...";
      micBtn.style.color = "var(--secondary)";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      input.value = transcript;
      input.focus();
    };

    recognition.onend = () => {
      micBtn.innerHTML = "🎤";
      micBtn.style.color = "";
    };

    recognition.onerror = (e) => {
      console.error("Voice recognition error:", e.error);
      micBtn.innerHTML = "🎤";
      micBtn.style.color = "";
      if (e.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      }
    };

    micBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        alert("Speech recognition failed to start. Please try again.");
      }
    });
  } else if (micBtn) {
    micBtn.disabled = true;
    micBtn.title = "Speech recognition not supported in this browser";
    micBtn.style.opacity = "0.5";
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

  /* ------------------------------
      LOGOUT HANDLER
  ------------------------------ */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      
      if (confirm("Are you sure you want to log out?")) {
        try {
          const form = logoutBtn.closest('form');
          if (form) {
            form.submit();
          } else {
            // Fallback: manual logout
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include"
            });
            window.location.href = "/login";
          }
        } catch (err) {
          console.error("Logout error:", err);
          window.location.href = "/login";
        }
      }
    });
  }

  /* ------------------------------
      KEYBOARD SHORTCUTS
  ------------------------------ */
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === input) {
        form.dispatchEvent(new Event('submit'));
      }
    }
    
    // Escape to clear input
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
    }
    
    // '/' to focus input
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.focus();
    }
  });

  /* ------------------------------
      INPUT AUTO-RESIZE (optional)
  ------------------------------ */
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  /* ------------------------------
      INITIALIZATION
  ------------------------------ */
  console.log("🎯 Starting chat system initialization...");
  
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeChatSystem().catch(err => {
      console.error("❌ Chat system initialization failed:", err);
      showErrorMessage("Failed to initialize chat. Please refresh the page.");
    });
  }, 100);
  
  // Add CSS animation for error messages
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .message {
      animation: fadeInUp 0.3s ease;
    }
    
    .chat-item {
      transition: all 0.2s ease;
    }
    
    .chat-item:hover {
      transform: translateX(2px);
    }
    
    .chat-item.active {
      box-shadow: 0 0 0 2px var(--secondary);
    }
  `;
  document.head.appendChild(style);
  
  console.log("✅ Chat.js setup complete");
});