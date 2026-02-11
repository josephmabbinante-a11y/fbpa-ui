// src/components/AIBot.jsx
import { useState } from 'react';

export default function AIBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setLoading(true);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_OPENAI_API_KEY', // Replace with your backend proxy for security
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [...messages, { role: 'user', content: input }]
        })
      });
      const data = await res.json();
      setMessages([...messages, { role: 'user', content: input }, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (err) {
      setMessages([...messages, { role: 'user', content: input }, { role: 'assistant', content: 'Error: Unable to get response.' }]);
    }
    setInput('');
    setLoading(false);
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
