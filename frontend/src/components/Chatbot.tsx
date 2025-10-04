import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

type Message = { role: 'user' | 'assistant'; content: string };

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await axios.post('/api/v1/chat/message', {
        messages: [...messages, userMsg],
      });

      const reply = resp.data?.reply || 'Sin respuesta';
      const botMsg: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errMsg: Message = { role: 'assistant', content: 'Error: no se pudo conectar al servidor.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div className="bg-space-dark/60 border border-space-blue/30 rounded-lg p-4 max-w-2xl mx-auto">
      <h4 className="text-lg font-semibold mb-3">Chatbot (Gemini)</h4>
      <div className="h-64 overflow-auto mb-3 p-2 bg-space-dark/40 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 px-3 py-2 rounded bg-gray-900 text-white border border-gray-700"
          placeholder="Escribe tu pregunta sobre exoplanetas..."
        />
        <button onClick={send} disabled={loading} className="px-4 py-2 bg-indigo-500 rounded text-white">
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
