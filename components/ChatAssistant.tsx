import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, MessageRole } from '../types';
import { chatWithAssistant, fastCheck, speakText } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Props {
  profile: UserProfile;
}

export default function ChatAssistant({ profile }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: MessageRole.MODEL, text: 'Hello! I can help you plan trips, find transport, or answer accessibility questions. How can I help?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'thinking' | 'fast'>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: MessageRole.USER, text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        let responseText = '';
        let urls: any[] = [];

        if (mode === 'fast') {
            responseText = await fastCheck(userMsg.text) || "I couldn't get a fast response.";
        } else {
            // Standard uses Search Grounding (gemini-3-flash) or Chat (gemini-3-pro) 
            // Thinking uses gemini-3-pro with thinking budget
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            const res = await chatWithAssistant(userMsg.text, history, profile, mode === 'thinking');
            responseText = res.text || "No response generated.";
            urls = res.urls;
        }

        const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: MessageRole.MODEL,
            text: responseText,
            timestamp: Date.now(),
            groundingUrls: urls
        };
        setMessages(prev => [...prev, modelMsg]);

    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: "Sorry, something went wrong.", timestamp: Date.now() }]);
    } finally {
        setLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
      if (isPlaying) return; // Prevent overlap for now
      setIsPlaying(true);
      const buffer = await speakText(text);
      if (buffer) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onended = () => setIsPlaying(false);
          source.start();
      } else {
          setIsPlaying(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-3 flex gap-2 overflow-x-auto shrink-0">
          <button 
            onClick={() => setMode('standard')} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${mode === 'standard' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            Chat & Search
          </button>
          <button 
            onClick={() => setMode('thinking')} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${mode === 'thinking' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            <span className="material-symbols-outlined text-xs">psychology</span>
            Deep Reasoning
          </button>
           <button 
            onClick={() => setMode('fast')} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${mode === 'fast' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            <span className="material-symbols-outlined text-xs">bolt</span>
            Fast
          </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === MessageRole.USER ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
               <div className="prose prose-sm max-w-none text-inherit dark:prose-invert">
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
               </div>
               
               {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-slate-100/20">
                       <p className="text-xs font-bold opacity-70 mb-1">Sources:</p>
                       <div className="flex flex-wrap gap-2">
                           {msg.groundingUrls.map((url, i) => (
                               <a key={i} href={url.uri} target="_blank" rel="noreferrer" className="text-xs underline opacity-80 hover:opacity-100 truncate max-w-[200px] block">
                                   {url.title || 'Source'}
                               </a>
                           ))}
                       </div>
                   </div>
               )}

               {msg.role === MessageRole.MODEL && (
                   <div className="mt-2 flex justify-end">
                       <button onClick={() => handleSpeak(msg.text)} className="p-1 hover:bg-black/5 rounded-full transition-colors" disabled={isPlaying}>
                           <span className={`material-symbols-outlined text-lg opacity-60 ${isPlaying ? 'text-blue-500' : ''}`}>volume_up</span>
                       </button>
                   </div>
               )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
               <div className="flex gap-1">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'thinking' ? "Ask a complex question..." : "Message OpenAccess..."}
            className="flex-1 px-4 py-2 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
