import { Brain, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { api } from '../../lib/api';
import { CoachChat } from './components/CoachChat';
import { CoachRecommendations } from './components/CoachRecommendations';
import type { Message, RecommendationResult, RecommendationResponse } from './types';

export function AICoachPage() {
  const [activeView, setActiveView] = useState<'chat' | 'recommendations'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am CarbonWise AI, your sustainability coach. Ask me questions about reducing your carbon footprint, green options, or how to reach your eco-friendly goals!',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Recommendation states
  const [selectedRecType, setSelectedRecType] = useState<'weekly_plan' | 'reduction_advice' | 'behavioral_insight'>('reduction_advice');
  const [recLoading, setRecLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setSending(true);
    setError('');

    try {
      const res = await api.post<{ response: string }>('/ai/chat', { message: userMsg });
      setMessages((prev) => [...prev, { sender: 'ai', text: res.response, timestamp: new Date() }]);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to get a response from the AI coach');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateRecommendation = async () => {
    setRecLoading(true);
    setError('');
    setRecommendationResult(null);
    try {
      const res = await api.post<RecommendationResponse>('/ai/recommendations', { type: selectedRecType });
      setRecommendationResult(res.recommendation);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to generate recommendations');
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Brain className="w-8 h-8 text-emerald-500" />
            <span>AI Eco-Coach</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Get personalized advice and insights from our Gemini-powered sustainability assistant.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-700">
        <button
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeView === 'chat'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
          onClick={() => setActiveView('chat')}
        >
          Chat Assistant
        </button>
        <button
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeView === 'recommendations'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
          onClick={() => setActiveView('recommendations')}
        >
          AI Recommendations
        </button>
      </div>

      {activeView === 'chat' ? (
        <CoachChat
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sending={sending}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <CoachRecommendations
          selectedRecType={selectedRecType}
          setSelectedRecType={setSelectedRecType}
          recLoading={recLoading}
          recommendationResult={recommendationResult}
          handleGenerateRecommendation={handleGenerateRecommendation}
        />
      )}
    </div>
  );
}
