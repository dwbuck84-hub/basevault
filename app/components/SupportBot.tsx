'use client';
import React, { useState, useRef, useEffect } from 'react';

interface SupportBotProps {
  walletAddress?: string;
}

export default function SupportBot({ walletAddress }: SupportBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'bot'; text: string; escalated?: boolean }[]>([
    { role: 'bot', text: 'Welcome to BaseVault System Telemetry. How can I assist your deployment or listing transaction today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;
    
    const currentInput = message;
    setLoading(true);
    setChatLog(prev => [...prev, { role: 'user', text: currentInput }]);
    setMessage('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: currentInput, userWalletAddress: walletAddress || 'Not Connected' })
      });
      const resData = await res.json();

      if (resData.success) {
        setChatLog(prev => [...prev, { 
          role: 'bot', 
          text: resData.data.aiResponseText,
          escalated: resData.data.needsDeveloperEscalation 
        }]);
      } else {
        throw new Error(resData.error);
      }
    } catch (e) {
      setChatLog(prev => [...prev, { role: 'bot', text: 'Connection timed out. Local terminal node sync failing.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-white">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-full shadow-lg border border-cyan-400/50 flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
          </span>
          🛰️ Help Portal
        </button>
      ) : (
        <div className="w-80 h-96 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-slate-950 p-4 border-b border-cyan-500/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs tracking-wider text-cyan-400 uppercase">System Telemetry AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed bg-slate-900/50">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={`p-3 rounded-lg max-w-[85%] border ${chat.role === 'user' ? 'bg-cyan-950/60 border-cyan-500/30 ml-auto text-left' : 'bg-slate-800/80 border-slate-700 mr-auto text-left'}`}>
                <p className="whitespace-pre-line">{chat.text}</p>
                {chat.escalated && (
                  <span className="text-[10px] block mt-2 text-amber-400 font-bold tracking-tight uppercase">🚨 Critical System Bug Logged</span>
                )}
              </div>
            ))}
            {loading && <div className="text-cyan-400/60 animate-pulse text-[11px]">Parsing node matrix...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 bg-slate-950 border-t border-cyan-500/20 flex gap-2">
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Report issue or ask a question..." 
              className="flex-1 bg-slate-900 text-xs p-2 rounded border border-slate-800 focus:outline-none focus:border-cyan-500 text-slate-200"
            />
            <button onClick={handleSendMessage} className="bg-cyan-500 text-black font-bold px-4 text-xs rounded hover:bg-cyan-400">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
