import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  User,
  Terminal,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { ChatMessage } from '../types';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_PROMPTS = [
  'Explain Volt Typhoon Living-off-the-Land TTPs and remediation',
  'How to hunt CVE-2024-3400 PAN-OS exploitation in Splunk & SIEM?',
  'Compare APT29 vs Lazarus Group financial cyber warfare tradecraft',
  'Draft an incident response containment guide for LockBit 3.0'
];

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString(),
      text: `Greetings, Analyst. I am **Aegis Intelligence AI Copilot**, your real-time Principal Cyber Threat Intelligence & DFIR advisor.\n\nI can analyze adversary TTPs, synthesize YARA/Sigma hunting logic, evaluate zero-day exploitability, and draft emergency containment playbooks.\n\nHow can I assist your investigation today?`,
      suggestedActions: INITIAL_PROMPTS
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/threat-intel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: [...messages, userMsg].slice(-6)
        })
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: data.responseMarkdown || 'Threat intelligence query processed.',
        suggestedActions: data.suggestedFollowUps || []
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Copilot error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: `Unable to connect to intelligence neural model. Please retry shortly.`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl text-slate-900 font-mono overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 font-mono">Aegis AI Copilot</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-slate-500 font-mono leading-none">
              Intelligence Assistant
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
          title="Minimize Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs font-mono bg-white">
          {messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${
                  isAI ? 'items-start' : 'items-end'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                  <span>{isAI ? 'AEGIS CTI COPILOT' : 'SOC ANALYST'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                    isAI
                      ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border border-indigo-400/40'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                    {msg.text}
                  </div>

                  {isAI && (
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Advisory
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Suggested Action Chips */}
                {isAI && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%]">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 text-left cursor-pointer font-medium shadow-3xs"
                      >
                        <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{action}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-mono text-xs w-fit shadow-3xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Analyzing global threat telemetry & synthesizing briefing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Aegis Copilot anything..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl shadow-md border border-indigo-400/40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  };
