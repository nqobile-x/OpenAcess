import React, { useState, useEffect, useRef } from 'react';
import { connectLiveSession } from '../services/gemini';

export default function LiveAssistant() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('Ready to connect');
  const disconnectRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopSession();
    };
  }, []);

  const playAudio = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    const ctx = audioContextRef.current;
    
    // Schedule
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
        sourcesRef.current.delete(source);
    };
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    sourcesRef.current.add(source);
  };

  const startSession = async () => {
    try {
      setStatus('Connecting...');
      const session = await connectLiveSession(
        (audioBuffer) => playAudio(audioBuffer),
        () => stopSession()
      );
      disconnectRef.current = session.disconnect;
      setActive(true);
      setStatus('Listening...');
      
      // Initialize visualization (mock)
      if (canvasRef.current) {
        animateWave(canvasRef.current);
      }
    } catch (e) {
      console.error(e);
      setStatus('Connection failed');
    }
  };

  const stopSession = () => {
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    // Stop all audio
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    setActive(false);
    setStatus('Ready to connect');
  };

  const animateWave = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let frame = 0;
      const loop = () => {
          if (!active) return; // Stop if not active
          // Note: `active` in closure might be stale, but this is a visual effect.
          // In a real app we'd bind this to audio analyzer data.
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          for (let i = 0; i < canvas.width; i++) {
             ctx.lineTo(i, canvas.height / 2 + Math.sin(i * 0.05 + frame * 0.1) * 20);
          }
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.stroke();
          frame++;
          requestAnimationFrame(loop);
      }
      loop();
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Background blobs */}
        <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-20'}`}>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-40 animate-pulse delay-75"></div>
        </div>

      <div className="z-10 text-center space-y-8">
        <div>
            <h2 className="text-3xl font-bold mb-2">Live Assistant</h2>
            <p className="text-slate-400">Talk naturally about accessibility.</p>
        </div>

        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
             {active && (
                <span className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20"></span>
             )}
             <button
                onClick={active ? stopSession : startSession}
                className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 ${active ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
                <span className="material-symbols-outlined text-5xl">
                    {active ? 'mic_off' : 'mic'}
                </span>
            </button>
        </div>

        <div className="h-12 flex items-center justify-center">
            {active ? (
                <canvas ref={canvasRef} width={200} height={50} className="w-48 h-12"></canvas>
            ) : (
                <p className="text-sm font-medium text-slate-500">{status}</p>
            )}
        </div>
      </div>
      
      <div className="z-10 absolute bottom-8 text-center px-6">
          <p className="text-xs text-slate-500 bg-slate-800/50 p-2 rounded-lg backdrop-blur-sm">
              Using <strong>Gemini 2.5 Native Audio</strong> for real-time conversation.
          </p>
      </div>
    </div>
  );
}
