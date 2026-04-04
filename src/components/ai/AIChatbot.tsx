import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ChevronRight, 
  Minimize2, 
  Maximize2,
  Loader2,
  Terminal,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "What is the expected ROI for the North region?",
  "How can I mitigate frost risks?",
  "Tell me about the current market trends for maize.",
  "What are the best crops for high-humidity areas?"
];

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Agricultural Assistant. How can I help you optimize your investments today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: text,
        config: {
          systemInstruction: "You are a professional agricultural investment assistant. Provide concise, data-driven advice on crop yields, ROI, risk mitigation, and regional farming strategies. Use markdown for formatting.",
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error while processing your request. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center z-50 group border-4 border-white"
          >
            <MessageSquare className="w-8 h-8" />
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-xs font-black rounded-xl opacity-0 pointer-events-none whitespace-nowrap uppercase tracking-widest shadow-xl"
            >
              Ask AI Assistant
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              filter: 'blur(0px)',
              height: isMinimized ? '80px' : '650px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
            className={`fixed bottom-8 right-8 w-[450px] max-w-[calc(100vw-64px)] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-primary/20 border border-white z-50 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between bg-primary text-white rounded-t-[2.5rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Agri-AI Pro</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] opacity-80 uppercase tracking-[0.2em] font-black">Intelligent Agent</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                >
                  {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-primary/5 to-transparent">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={msg.id} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                          msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/10'
                        }`}>
                          {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm shadow-xl shadow-primary/5 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-foreground border border-primary/5 rounded-tl-none'
                        }`}>
                          <div className={`prose prose-sm max-w-none font-medium leading-relaxed ${msg.role === 'user' ? 'prose-invert' : 'prose-p:text-foreground/80'}`}>
                            <Markdown>{msg.content}</Markdown>
                          </div>
                          <p className={`text-[10px] mt-3 font-black uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : ''}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white text-primary border border-primary/10 flex items-center justify-center shrink-0 shadow-lg">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="bg-white border border-primary/5 p-5 rounded-[2rem] rounded-tl-none shadow-xl shadow-primary/5 flex items-center gap-3">
                        <div className="flex gap-1">
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                        <span className="text-xs text-primary font-black uppercase tracking-widest">Analyzing Data</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Prompts */}
                {messages.length === 1 && !isLoading && (
                  <div className="px-6 py-4 bg-white/50 border-t border-primary/5">
                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary" />
                      Quick Insights
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_PROMPTS.map((prompt, idx) => (
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.1)' }}
                          whileTap={{ scale: 0.95 }}
                          key={idx}
                          onClick={() => handleSend(prompt)}
                          className="text-xs px-4 py-2.5 bg-white border border-primary/10 rounded-2xl text-primary font-bold shadow-sm hover:border-primary/30 transition-all flex items-center gap-2 group"
                        >
                          {prompt}
                          <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-6 bg-white border-t border-primary/5 rounded-b-[2.5rem]">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend(input);
                    }}
                    className="relative"
                  >
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything about your investments..."
                      className="w-full pl-6 pr-16 py-5 bg-primary/5 border border-primary/10 rounded-[1.5rem] focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white outline-none text-sm font-medium transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50 disabled:hover:bg-primary active:scale-90"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-primary/30 font-black uppercase tracking-[0.2em]">
                    <Terminal className="w-3 h-3" />
                    <span>Powered by Gemini 3.1 Flash</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
