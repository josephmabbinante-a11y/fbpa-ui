// src/components/AIBot.jsx
import { useState } from 'react';

export default function AIBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Auth headers would be needed here, e.g., from localStorage
          // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      const assistantMessage = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = { role: 'assistant', content: 'Error: Unable to get response.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 340, background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 2000 }}>
      <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 700 }}>AI Assistant</div>
      <div style={{ maxHeight: 220, overflowY: 'auto', padding: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, color: m.role === 'assistant' ? '#1976d2' : '#333' }}>
            <b>{m.role === 'assistant' ? 'AI' : 'You'}:</b> {m.content}
          </div>
        ))}
        {loading && <div>AI is typing...</div>}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #eee', padding: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me to automate..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15 }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ marginLeft: 8, padding: '6px 14px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
}
