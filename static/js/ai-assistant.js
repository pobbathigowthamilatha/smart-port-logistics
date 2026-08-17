/* ==========================================================================
   AI-Powered Smart Port & Logistics Management System - AI Assistant Simulator
   Interactive Query Processing & Response Generation Engine
   ========================================================================== */

function handlePromptClick(promptKey, promptText) {
  const input = document.getElementById('aiChatInput');
  if (input) input.value = promptText;
  sendAiQuery(promptKey, promptText);
}

function sendAiUserMessage() {
  const input = document.getElementById('aiChatInput');
  if (!input || !input.value.trim()) return;

  const userQuery = input.value.trim();
  sendAiQuery('custom', userQuery);
  input.value = '';
}

function sendAiQuery(promptKey, userText) {
  const chatBody = document.getElementById('aiChatBody');
  if (!chatBody) return;

  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'chat-msg user-msg';
  userMsgDiv.innerHTML = `
    <div class="chat-bubble">
      ${escapeHtml(userText)}
    </div>
  `;
  chatBody.appendChild(userMsgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg ai-msg';
  typingDiv.id = 'aiTypingIndicator';
  typingDiv.innerHTML = `
    <div class="ai-avatar">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="chat-bubble text-muted">
      <i class="fa-solid fa-spinner fa-spin me-2"></i> Consulting Gemini on port telemetry data...
    </div>
  `;
  chatBody.appendChild(typingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;

  fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: userText,
      prompt_key: promptKey
    })
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Unable to reach the AI service right now.');
      }

      return data;
    })
    .then((data) => {
      const indicator = document.getElementById('aiTypingIndicator');
      if (indicator) indicator.remove();

      const answer = data.answer || 'I could not generate a response.';
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = 'chat-msg ai-msg';
      aiMsgDiv.innerHTML = `
        <div class="ai-avatar">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="chat-bubble" style="max-width: 90%;">
          <div class="fw-bold text-cyan mb-2" style="font-size: 1rem;">
            <i class="fa-solid fa-brain me-2"></i>Port Intelligence Agent
          </div>
          <div style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(answer).replace(/\n/g, '<br>')}</div>
        </div>
      `;
      chatBody.appendChild(aiMsgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    })
    .catch((error) => {
      const indicator = document.getElementById('aiTypingIndicator');
      if (indicator) indicator.remove();

      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = 'chat-msg ai-msg';
      aiMsgDiv.innerHTML = `
        <div class="ai-avatar">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="chat-bubble text-warning" style="max-width: 90%;">
          <div class="fw-bold text-warning mb-1">
            <i class="fa-solid fa-triangle-exclamation me-2"></i> AI service unavailable
          </div>
          ${escapeHtml(error.message || 'The assistant is temporarily unavailable.')}
        </div>
      `;
      chatBody.appendChild(aiMsgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
