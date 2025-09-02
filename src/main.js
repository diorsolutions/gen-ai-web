const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const themeToggle = document.getElementById("themeToggle");
const emojiButton = document.getElementById("emojiButton");
const emojiPicker = document.getElementById("emojiPicker");

import "./prettty.css";

let isLoading = false;

// Markdown va code highlighting kutubxonalari yuklash
const loadLibraries = () => {
  // marked.js yuklash
  if (!window.marked) {
    const markedScript = document.createElement("script");
    markedScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js";
    document.head.appendChild(markedScript);
  }

  // highlight.js yuklash
  if (!window.hljs) {
    const hljsScript = document.createElement("script");
    hljsScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
    document.head.appendChild(hljsScript);

    // highlight.js CSS yuklash
    const hljsCSS = document.createElement("link");
    hljsCSS.rel = "stylesheet";
    hljsCSS.href =
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    document.head.appendChild(hljsCSS);
  }
};
setTimeout(() => {
  if (window.hljs) {
    // Highlight all code blocks within messages container
    messagesContainer.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);

      // Copy button qo‘shish
      if (!block.parentElement.querySelector(".copy-btn")) {
        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Copy";
        copyBtn.className = "copy-btn";
        block.parentElement.style.position = "relative";
        copyBtn.style.position = "absolute";
        copyBtn.style.top = "8px";
        copyBtn.style.right = "8px";
        block.parentElement.appendChild(copyBtn);
      }
    });
  }
}, 100);

// Markdown render qilish uchun funksiya
const renderMarkdown = (text) => {
  // Kutubxonalar yuklanganini tekshirish
  if (!window.marked || !window.hljs) {
    return text; // Agar kutubxonalar yuklanmagan bo'lsa, oddiy matn qaytarish
  }

  // marked.js konfiguratsiyasi
  marked.setOptions({
    highlight: function (code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          return hljs.highlight(code, { language: language }).value;
        } catch (e) {
          console.warn("Code highlighting error:", e);
        }
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
  });

  try {
    return marked.parse(text);
  } catch (error) {
    console.warn("Markdown parsing error:", error);
    return text;
  }
};

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  if (theme === "dark") {
    themeToggle.textContent = "🌙";
  } else {
    themeToggle.textContent = "☀️";
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 96) + "px";
}

function addMessage(content, type = "ai") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content";

  if (type === "ai") {
    // AI javoblarini markdown sifatida render qilish
    const renderedContent = renderMarkdown(content);
    contentWrapper.innerHTML = renderedContent;

    // Code bloklarni highlight qilish
    setTimeout(() => {
      if (window.hljs) {
        contentWrapper.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    }, 100);
    // Copy action area
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.style.marginTop = "8px";
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const copyBtn = document.createElement("button");
    copyBtn.className = "ai-copy-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.setAttribute("aria-label", "Copy AI message");
    copyBtn.style.border = "1px solid var(--border-color)";
    copyBtn.style.background = "var(--bg-tertiary)";
    copyBtn.style.color = "var(--text-primary)";
    copyBtn.style.fontSize = "0.75rem";
    copyBtn.style.padding = "0.35rem 0.6rem";
    copyBtn.style.borderRadius = "0.5rem";
    copyBtn.style.cursor = "pointer";
    copyBtn.style.transition = "all 0.2s ease";

    actions.appendChild(copyBtn);
    contentWrapper.appendChild(actions);
  } else {
    // User xabarlarini oddiy matn sifatida ko'rsatish
    contentWrapper.textContent = content;
  }

  messageDiv.appendChild(contentWrapper);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Smooth scroll animatsiyasi
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateY(20px)";

  requestAnimationFrame(() => {
    messageDiv.style.transition = "all 0.3s ease";
    messageDiv.style.opacity = "1";
    messageDiv.style.transform = "translateY(0)";
  });
}

// Keywords ekstakt qilish funksiyasi
const extractKeywords = (text) => {
  const commonWords = [
    "what",
    "is",
    "how",
    "why",
    "when",
    "where",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const keywords = words
    .filter((word) => word.length > 3 && !commonWords.includes(word))
    .slice(0, 3); // faqat birinchi 3 ta keyword

  return keywords;
};

// Dynamic loading messages
const loadingMessages = [
  (keywords) =>
    `Analyzing <span class="keyword-highlight">${
      keywords[0] || "query"
    }</span>...`,
  (keywords) =>
    `Searching for <span class="keyword-highlight">${keywords.join(
      " + "
    )}</span> information...`,
  (keywords) =>
    `Processing <span class="keyword-highlight">${
      keywords[0] || "request"
    }</span> data...`,
  (keywords) =>
    `Understanding <span class="keyword-highlight">${
      keywords[1] || "context"
    }</span>...`,
  (keywords) =>
    `Generating response about <span class="keyword-highlight">${
      keywords[0] || "topic"
    }</span>...`,
  (keywords) =>
    `Finalizing <span class="keyword-highlight">${keywords.join(
      " & "
    )}</span> explanation...`,
];

function showLoading(userMessage = "") {
  const keywords = extractKeywords(userMessage);
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message ai loading";
  loadingDiv.id = "loading-message";

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content loading-content";

  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";

  const textElement = document.createElement("div");
  textElement.className = "loading-text typing-animation";

  contentWrapper.appendChild(spinner);
  contentWrapper.appendChild(textElement);
  loadingDiv.appendChild(contentWrapper);
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Dinamik loading textlarini ko'rsatish
  let messageIndex = 0;
  const showNextMessage = () => {
    if (messageIndex < loadingMessages.length) {
      const messageText = loadingMessages[messageIndex](keywords);
      textElement.innerHTML = messageText;
      messageIndex++;

      // Har bir xabar uchun turli vaqt oralig'i
      const delay =
        messageIndex === 1
          ? 800
          : messageIndex === loadingMessages.length
            ? 1500
            : 1200;
      setTimeout(showNextMessage, delay);
    }
  };

  // Birinchi xabarni darhol ko'rsatish
  showNextMessage();
}

function hideLoading() {
  const loadingMessage = document.getElementById("loading-message");
  if (loadingMessage) {
    loadingMessage.style.opacity = "0";
    loadingMessage.style.transform = "translateY(-10px)";
    setTimeout(() => {
      loadingMessage.remove();
    }, 200);
  }
}

function updateSendButton() {
  const hasText = messageInput.value.trim().length > 0;
  sendButton.disabled = isLoading || !hasText;

  if (isLoading) {
    sendButton.innerHTML =
      '<div class="spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></div>';
    sendButton.classList.add("loading");
  } else {
    sendButton.innerHTML = '📤';
    sendButton.classList.remove("loading");
  }
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || isLoading) return;

  isLoading = true;
  updateSendButton();

  addMessage(message, "user");
  messageInput.value = "";
  autoResizeTextarea();

  showLoading(message);

  try {
    const response = await fetch("http://localhost:3000/prompt", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: message }),
});


    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    hideLoading();

    setTimeout(() => {
      addMessage(text, "ai");
    }, 100);
  } catch (error) {
    hideLoading();
    addMessage(
      "❌ **Xatolik yuz berdi.** Iltimos qaytadan urinib ko'ring.\n\n**Xatolik tafsilotlari:** " +
        error.message,
      "ai"
    );
    console.error("Error:", error);
  } finally {
    setTimeout(() => {
      isLoading = false;
      updateSendButton();
      messageInput.focus();
    }, 500);
  }
}

// Typing effect uchun funksiya (ixtiyoriy)
function typeMessage(element, text, speed = 30) {
  let i = 0;
  element.innerHTML = "";

  const typeInterval = setInterval(() => {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
    }
  }, speed);
}

function addCopyButtons() {
  document.addEventListener("click", (e) => {
    // Existing code-block copy buttons
    if (e.target.classList.contains("copy-btn")) {
      const codeBlock = e.target.nextElementSibling.querySelector("code");
      const text = codeBlock ? codeBlock.textContent : "";

      navigator.clipboard
        .writeText(text)
        .then(() => {
          e.target.textContent = "✓ Nusxalandi";
          setTimeout(() => {
            e.target.textContent = "Copy";
          }, 2000);
        })
        .catch(() => {
          console.warn("Copy failed");
        });
      return;
    }

    // New: Copy AI message button
    if (e.target.classList.contains("ai-copy-btn")) {
      const messageEl = e.target.closest(".message.ai");
      if (!messageEl) return;

      // Prefer raw markdown text if available, otherwise textContent
      const contentEl = messageEl.querySelector(".message-content");
      if (!contentEl) return;

      // Collect text: include code blocks text, list items etc. without extra UI labels
      let aggregated = "";
      const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        aggregated += node.nodeValue;
      }
      const text = aggregated.trim();

      navigator.clipboard
        .writeText(text)
        .then(() => {
          const original = e.target.textContent;
          e.target.textContent = "✓ Copied";
          e.target.disabled = true;
          setTimeout(() => {
            e.target.textContent = original;
            e.target.disabled = false;
          }, 1600);
        })
        .catch(() => {
          console.warn("Copy failed");
        });
    }
  });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K - Focus input
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      messageInput.focus();
    }

    // Shift + E - Focus input
    if (e.shiftKey && e.key === "E") {
      e.preventDefault();
      messageInput.focus();
    }

    // Escape - Clear input
    if (e.key === "Escape" && document.activeElement === messageInput) {
      messageInput.value = "";
      autoResizeTextarea();
      updateSendButton();
    }
  });
}

// Emoji picker functionality
function setupEmojiPicker() {
  let hoverTimeout;
  let isHovering = false;

  // Show emoji picker on hover
  emojiButton.addEventListener("mouseenter", () => {
    isHovering = true;
    clearTimeout(hoverTimeout);
    emojiPicker.classList.add("show");
  });

  // Hide emoji picker when mouse leaves
  emojiButton.addEventListener("mouseleave", () => {
    isHovering = false;
    hoverTimeout = setTimeout(() => {
      if (!isHovering) {
        emojiPicker.classList.remove("show");
      }
    }, 150);
  });

  // Keep picker open when hovering over it
  emojiPicker.addEventListener("mouseenter", () => {
    isHovering = true;
    clearTimeout(hoverTimeout);
  });

  emojiPicker.addEventListener("mouseleave", () => {
    isHovering = false;
    hoverTimeout = setTimeout(() => {
      if (!isHovering) {
        emojiPicker.classList.remove("show");
      }
    }, 150);
  });

  // Handle emoji selection
  emojiPicker.addEventListener("click", (e) => {
    if (e.target.classList.contains("emoji-item")) {
      const emoji = e.target.textContent;
      const cursorPos = messageInput.selectionStart;
      const textBefore = messageInput.value.substring(0, cursorPos);
      const textAfter = messageInput.value.substring(messageInput.selectionEnd);

      messageInput.value = textBefore + emoji + textAfter;
      messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;

      autoResizeTextarea();
      updateSendButton();
      messageInput.focus();

      // Hide picker after selection
      emojiPicker.classList.remove("show");
      isHovering = false;
    }
  });

  // Close emoji picker on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && emojiPicker.classList.contains("show")) {
      emojiPicker.classList.remove("show");
      isHovering = false;
    }
  });
}

// Event listeners
themeToggle.addEventListener("click", toggleTheme);
sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("input", () => {
  autoResizeTextarea();
  updateSendButton();
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("paste", () => {
  setTimeout(() => {
    autoResizeTextarea();
    updateSendButton();
  }, 0);
});

// Fokus yo'qolganda va qaytganda
window.addEventListener("focus", () => {
  if (!isLoading) {
    messageInput.focus();
  }
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadLibraries();
  initTheme();
  updateSendButton();
  setupKeyboardShortcuts();
  setupEmojiPicker();
  addCopyButtons();
  messageInput.focus();

  // Kutubxonalar yuklanganini kutish
  const checkLibraries = setInterval(() => {
    if (window.marked && window.hljs) {
      clearInterval(checkLibraries);
      console.log("✅ Markdown va Highlight.js kutubxonalari yuklandi");
    }
  }, 100);
});
