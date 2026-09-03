'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getStoreData, selectNextTarget, UserStoreData } from '@/lib/store';
import { Card, Button, Badge } from '@/components/ui';
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowRight,
  Bot,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'xira';
  text: string;
  timestamp: number;
}

export default function XiraPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = getStoreData();
    setStoreData(data);

    const initialGreeting = `Hello ${data.handle || 'Learner'}! I'm XIRA, your AI tutor. How can I help you master ${data.goalText || 'your current course'} today?`;
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'xira',
        text: initialGreeting,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const target = storeData ? selectNextTarget(storeData) : null;

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          topic: storeData?.goalText || '',
          conceptName: target?.conceptName || '',
          language: storeData?.learnerProfile?.language || 'english',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const replyText = data?.reply || data?.text || 'I am ready to help you continue your learning journey.';

      const xiraMsg: ChatMessage = {
        id: `xira_${Date.now()}`,
        sender: 'xira',
        text: replyText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, xiraMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `xira_err_${Date.now()}`,
          sender: 'xira',
          text: 'I had trouble connecting. Let me know if you would like to review concepts or jump into your next interactive lesson!',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined') return;

    if (speakingId === msgId) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeakingId(msgId);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12 font-sans select-none flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-white">XIRA AI Tutor</h1>
            <p className="font-sans text-[11px] text-slate-400">Personalized Learning & Conceptual Guidance</p>
          </div>
        </div>

        {target && (
          <Link href={`/tutor/${target.conceptId}`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Lesson
            </Button>
          </Link>
        )}
      </div>

      {/* Suggested Starters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
        {[
          'Explain key concept simply',
          'Give me an analogy',
          'Practice quiz question',
          'How do I improve mastery?',
        ].map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => handleSendMessage(starter)}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-cyan-400/40 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Chat Dialogue Area */}
      <Card variant="default" className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px] max-h-[550px] bg-[#090A0F]/90 border-white/[0.08]">
        {messages.map((msg) => {
          const isXira = msg.sender === 'xira';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isXira ? 'justify-start' : 'justify-end'}`}
            >
              {isXira && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] space-y-1.5 text-xs sm:text-sm leading-relaxed ${
                  isXira
                    ? 'bg-[#151928] border border-white/[0.08] text-slate-200'
                    : 'bg-indigo-600 text-white rounded-br-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {isXira && (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className="text-slate-400 hover:text-cyan-300 p-1 transition-colors"
                      title="Read aloud"
                    >
                      {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-cyan-300" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-slate-400 font-mono text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span>XIRA is formulating explanation...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask XIRA about any concept or topic..."
          className="flex-1 h-12 px-4 rounded-xl bg-[#0D0F18] border border-white/[0.12] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!input.trim() || isLoading}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
