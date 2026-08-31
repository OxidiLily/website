import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, Wand2, Lightbulb, Code2, ArrowRight } from 'lucide-react';
import { PageId } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: {
    label: string;
    targetPage: PageId;
  };
}

const QUICK_PROMPTS = [
  { label: '🔥 Lihat Proyek Terbaik', prompt: 'Apa saja proyek unggulan di portfolio ini?' },
  { label: '🛠️ Tech Stack & Skills', prompt: 'Teknologi apa saja yang dikuasai?' },
  { label: '✍️ Baca Artikel Blog', prompt: 'Rekomendasikan artikel blog terbaru' },
  { label: '📬 Cara Menghubungi', prompt: 'Bagaimana cara menghubungi studio untuk kolaborasi?' },
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya Studio AI Assistant. Saya siap membantu kamu mengeksplorasi portfolio, proyek 3D physics, artikel engineering, atau mendiskusikan peluang kolaborasi.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Contextual smart AI responses
    setTimeout(() => {
      let reply = '';
      let action: { label: string; targetPage: PageId } | undefined;

      const lower = text.toLowerCase();
      if (lower.includes('proyek') || lower.includes('project') || lower.includes('karya') || lower.includes('portfolio')) {
        reply = 'Studio ini memiliki beberapa proyek unggulan seperti 3D WebGL Ballpit, Design System Neomorphic, dan E-Commerce Platform berkecapatan tinggi.';
        action = { label: 'Buka Halaman Projects', targetPage: 'project' };
      } else if (lower.includes('tech') || lower.includes('skill') || lower.includes('stack') || lower.includes('bahasa')) {
        reply = 'Stack utama mencakup React 19, TypeScript, Tailwind CSS, Three.js / OGL untuk visual 3D WebGL, Motion, serta Next.js dan Node.js di sisi arsitektur modern.';
        action = { label: 'Pelajari di About', targetPage: 'about' };
      } else if (lower.includes('blog') || lower.includes('artikel') || lower.includes('baca')) {
        reply = 'Kamu dapat membaca artikel mendalam tentang WebGL Performance, Interactive Physics, dan Modern UI Architecture di halaman Blog.';
        action = { label: 'Eksplor Blog', targetPage: 'blog' };
      } else if (lower.includes('kontak') || lower.includes('hubungi') || lower.includes('email') || lower.includes('hire') || lower.includes('kolaborasi')) {
        reply = 'Kami terbuka untuk freelance, proyek studio, dan konsultasi arsitektur frontend. Silakan kirim pesan melalui halaman Contact.';
        action = { label: 'Kirim Pesan', targetPage: 'contact' };
      } else if (lower.includes('admin') || lower.includes('dashboard') || lower.includes('backend') || lower.includes('cms')) {
        reply = 'Dashboard backend admin digunakan untuk mengelola konten website, pelacak sprint, kanban backlog, proyek aktif/arsip, dan integrasi API.';
        action = { label: 'Buka Admin Portal', targetPage: 'admin' };
      } else {
        reply = `Terima kasih atas pertanyaannya mengenai "${text}". Kamu dapat menjelajahi seluruh bagian website kami untuk melihat detail lebih lengkap.`;
        action = { label: 'Kembali ke Home', targetPage: 'home' };
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        action,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
          {/* Backdrop (50% opacity & subtle blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
          />

          {/* Modal Container (Almost Fullscreen) */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full sm:w-[94vw] max-w-4xl h-[92vh] sm:h-[88vh] bg-[#0c0c0f] border border-white/20 rounded-t-[28px] sm:rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col z-10"
          >
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-neutral-900 to-black">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-[1.5px] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-white tracking-wide">AI Assistant</h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">Interactive Creative Guide</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup AI modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-white text-black font-medium rounded-tr-sm shadow-md'
                        : 'bg-neutral-900/90 text-neutral-200 border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    <p className="leading-relaxed text-xs sm:text-sm">{msg.text}</p>
                    {msg.action && (
                      <button
                        onClick={() => {
                          onNavigate(msg.action!.targetPage);
                          onClose();
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>{msg.action.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-neutral-900 border border-white/10 rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Suggestions */}
            <div className="px-4 py-2 border-t border-white/5 bg-neutral-950/60 overflow-x-auto flex gap-2 no-scrollbar">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 sm:p-4 bg-neutral-950 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Tanyakan sesuatu pada Studio AI..."
                className="flex-1 bg-neutral-900 border border-white/15 rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md"
                aria-label="Kirim pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
