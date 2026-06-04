const Chat = {
  sending: false,

  suggestions: [
    'Give me a summary of my data',
    'How many rows do I have?',
    'What are the top values?',
    'Show me key statistics',
    'What trends can you see?',
    'Which column has the highest average?'
  ],

  render() {
    return `
    <div class="page-header">
      <div class="page-title">AI Assistant</div>
      <div class="page-subtitle">Ask anything about your uploaded data</div>
    </div>

    <div class="chat-suggestions" id="chat-suggestions">
      ${this.suggestions.map(s => `<button class="suggestion-chip">${s}</button>`).join('')}
    </div>

    <div class="chat-layout">
      <div class="chat-messages" id="chat-messages">
        <div class="msg bot">
          <div class="msg-avatar">🤖</div>
          <div class="msg-bubble">Hi! I'm your DataLens AI assistant. Upload some data and I'll help you uncover insights, answer questions, and explain trends. What would you like to know?</div>
        </div>
      </div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chat-input" placeholder="Ask me anything about your data..." rows="1"></textarea>
        <button class="chat-send-btn" id="chat-send-btn" title="Send">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
          </svg>
        </button>
      </div>
    </div>`;
  },

  bind() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent;
        input.focus();
        this.sendMessage();
      });
    });
  },

  appendMsg(role, content) {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    const avatar = role === 'user'
      ? `<div class="msg-avatar">${(Auth.currentUser?.name || 'U')[0].toUpperCase()}</div>`
      : `<div class="msg-avatar">🤖</div>`;
    div.innerHTML = `${avatar}<div class="msg-bubble">${this.escapeHtml(content)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  },

  showTyping() {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.id = 'typing-indicator';
    div.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  },

  escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  },

  async sendMessage() {
    if (this.sending) return;
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    this.sending = true;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('chat-send-btn').disabled = true;

    this.appendMsg('user', message);
    this.showTyping();

    try {
      const { reply } = await Api.post('/chat/message', { message });
      this.removeTyping();
      this.appendMsg('bot', reply);
    } catch (err) {
      this.removeTyping();
      this.appendMsg('bot', `Sorry, I encountered an error: ${err.message}`);
    } finally {
      this.sending = false;
      document.getElementById('chat-send-btn').disabled = false;
      input.focus();
    }
  }
};
