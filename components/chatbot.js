// ============================================
// FILORAE — AI Chatbot Component
// ============================================

import { getChatResponse } from '../firebase/ai.js';

class FiloraeChatbot {
  constructor() {
    this.isOpen = false;
    this.history = [];
    this.isTyping = false;
    this.loadHistory();
    this.init();
  }

  async init() {
    // Dynamically load Marked.js for markdown parsing if not present
    if (typeof marked === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    }

    this.renderDOM();
    this.bindEvents();
    
    // Send a welcome message if history is empty
    if (this.history.length === 0) {
      this.addMessage('bot', "Hello! 🌿 I'm Filo, your personal shopping assistant. How can I help you find the perfect crochet gift today?");
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  loadHistory() {
    const saved = sessionStorage.getItem('filorae_chat_history');
    if (saved) {
      try {
        this.history = JSON.parse(saved);
      } catch (e) {
        this.history = [];
      }
    }
  }

  saveHistory() {
    sessionStorage.setItem('filorae_chat_history', JSON.stringify(this.history));
  }

  renderDOM() {
    const container = document.createElement('div');
    container.id = 'filorae-chatbot-container';
    
    container.innerHTML = `
      <!-- Trigger Button -->
      <div class="chatbot-trigger" id="chatbot-trigger" aria-label="Open chat">
        <i data-lucide="message-circle" style="width:28px;height:28px;"></i>
      </div>

      <!-- Chat Window -->
      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <div class="chatbot-header__info">
            <div class="chatbot-avatar">
              <i data-lucide="sparkles" style="width:20px;height:20px;"></i>
            </div>
            <div>
              <h3 style="font-size:var(--text-base);font-weight:var(--fw-semibold);margin:0;">Filo</h3>
              <p style="font-size:var(--text-xs);margin:0;opacity:0.9;">AI Shopping Assistant</p>
            </div>
          </div>
          <button class="icon-btn chatbot-header__close" id="chatbot-close">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
          </button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <!-- Messages injected here -->
        </div>

        <div class="chatbot-input-area">
          <textarea class="chat-input" id="chatbot-input" placeholder="Ask about products, shipping..." rows="1"></textarea>
          <button class="chat-send-btn" id="chatbot-send" disabled>
            <i data-lucide="send" style="width:18px;height:18px;margin-left:-2px;"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    if (window.lucide) window.lucide.createIcons();

    this.elements = {
      trigger: document.getElementById('chatbot-trigger'),
      window: document.getElementById('chatbot-window'),
      closeBtn: document.getElementById('chatbot-close'),
      messagesContainer: document.getElementById('chatbot-messages'),
      input: document.getElementById('chatbot-input'),
      sendBtn: document.getElementById('chatbot-send')
    };

    // Render initial history
    this.history.forEach(msg => {
      // Internal history format: { role: 'user'|'model', parts: [{text: '...'}] }
      // Map 'model' to 'bot' for UI
      this.renderMessage(msg.role === 'model' ? 'bot' : 'user', msg.parts[0].text);
    });
  }

  bindEvents() {
    this.elements.trigger.addEventListener('click', () => this.toggleChat());
    this.elements.closeBtn.addEventListener('click', () => this.toggleChat());
    
    this.elements.input.addEventListener('input', (e) => {
      this.elements.sendBtn.disabled = e.target.value.trim().length === 0 || this.isTyping;
      // Auto-resize
      e.target.style.height = 'auto';
      e.target.style.height = (e.target.scrollHeight) + 'px';
    });

    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.elements.sendBtn.addEventListener('click', () => this.handleSend());
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.elements.window.classList.add('is-open');
      this.elements.trigger.style.transform = 'scale(0)';
      this.elements.input.focus();
      this.scrollToBottom();
    } else {
      this.elements.window.classList.remove('is-open');
      this.elements.trigger.style.transform = 'scale(1)';
    }
  }

  renderMessage(sender, text, isStreaming = false) {
    let msgEl = isStreaming ? document.getElementById('streaming-msg') : null;
    
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.className = `chat-msg chat-msg--${sender}`;
      if (isStreaming) msgEl.id = 'streaming-msg';
      this.elements.messagesContainer.appendChild(msgEl);
    }

    if (sender === 'bot') {
      // Use marked for bot responses
      msgEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;
    } else {
      msgEl.textContent = text;
    }

    this.scrollToBottom();
    return msgEl;
  }

  showTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg--bot';
    el.id = 'typing-indicator';
    el.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    this.elements.messagesContainer.appendChild(el);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  scrollToBottom() {
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  async handleSend() {
    const text = this.elements.input.value.trim();
    if (!text || this.isTyping) return;

    // Reset input
    this.elements.input.value = '';
    this.elements.input.style.height = 'auto';
    this.elements.sendBtn.disabled = true;

    // Add User Message
    this.renderMessage('user', text);
    
    // Strip leading 'model' messages to satisfy Vertex AI constraints
    let chatHistoryPayload = [...this.history];
    while (chatHistoryPayload.length > 0 && chatHistoryPayload[0].role === 'model') {
      chatHistoryPayload.shift();
    }
    
    this.history.push({ role: 'user', parts: [{ text }] });
    this.saveHistory();

    this.isTyping = true;
    this.showTypingIndicator();

    try {
      // Call Gemini REST API
      const fullResponse = await getChatResponse(chatHistoryPayload, text);
      
      this.removeTypingIndicator();
      this.renderMessage('bot', fullResponse, false);
      
      this.history.push({ role: 'model', parts: [{ text: fullResponse }] });
      this.saveHistory();

    } catch (error) {
      console.error(error);
      this.removeTypingIndicator();
      this.renderMessage('bot', 'Sorry, I am having trouble connecting right now. Please try again later. 🌸');
    } finally {
      this.isTyping = false;
      this.elements.sendBtn.disabled = false;
    }
  }

  // Can be called to manually add messages (e.g. initial greeting)
  addMessage(sender, text) {
    if (sender === 'bot') {
      this.history.push({ role: 'model', parts: [{ text }] });
    } else {
      this.history.push({ role: 'user', parts: [{ text }] });
    }
    this.saveHistory();
    this.renderMessage(sender, text);
  }
}

export function initChatbot() {
  return new FiloraeChatbot();
}
