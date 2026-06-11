import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, BookOpen, Trash2, HelpCircle, Shield, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { api } from '../../lib/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface RecommendationResponse {
  recommendation: any;
  type: string;
}

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
  const [recommendationResult, setRecommendationResult] = useState<any>(null);

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
        <div className="glass-card flex flex-col h-[500px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hidden">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white shadow-md rounded-tr-none'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-none border border-surface-200/50 dark:border-surface-700/40'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-surface-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl rounded-tl-none p-4 border border-surface-200/50 dark:border-surface-700/40 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-200 dark:border-surface-800 flex gap-3">
            <input
              type="text"
              placeholder="Ask anything about carbon footprints, reduction tips..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sending}
              className="flex-1 input-field py-2.5 text-sm"
            />
            <button type="submit" disabled={sending || !inputMessage.trim()} className="btn-primary py-2 px-5">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-card p-6 space-y-6 h-fit">
            <h3 className="font-bold text-lg">Select Advice Focus</h3>
            <p className="text-xs text-surface-500">
              Generate target plans, behavioral insights, or step-by-step reduction targets.
            </p>

            <div className="space-y-2">
              {[
                { type: 'reduction_advice', label: 'Reduction Advice', desc: 'Get practical action tips.' },
                { type: 'weekly_plan', label: 'Weekly plan', desc: 'Step-by-step daily eco guide.' },
                { type: 'behavioral_insight', label: 'Behavioral Insights', desc: 'Identify patterns in your history.' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedRecType(item.type as any)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedRecType === item.type
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20'
                      : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:border-surface-300'
                  }`}
                >
                  <h4 className="font-bold text-sm">{item.label}</h4>
                  <p className="text-[10px] text-surface-500 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateRecommendation}
              disabled={recLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {recLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Advice</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 glass-card p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
            {recLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                <p className="text-xs text-surface-500 animate-pulse">Engaging Gemini analysis model...</p>
              </div>
            ) : recommendationResult ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center border-b border-surface-200 dark:border-surface-800 pb-3">
                  <h3 className="font-bold text-lg capitalize">{selectedRecType.replace('_', ' ')}</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-1 rounded">
                    Freshly Calibrated
                  </span>
                </div>

                {/* Structured recommendation responses */}
                {selectedRecType === 'reduction_advice' && recommendationResult.recommendations && (
                  <div className="space-y-4">
                    {recommendationResult.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/50 dark:border-surface-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm">{rec.title}</h4>
                          <span className="text-[10px] bg-emerald-600/15 text-emerald-500 font-bold px-2 py-0.5 rounded capitalize">
                            {rec.impact} Impact
                          </span>
                        </div>
                        <p className="text-xs text-surface-600 dark:text-surface-400">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRecType === 'weekly_plan' && recommendationResult.days && (
                  <div className="space-y-4">
                    <p className="text-xs text-surface-500">Weekly Target Reduction: {recommendationResult.weeklyTotal}</p>
                    {recommendationResult.days.map((d: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/40">
                        <span className="font-bold text-sm text-emerald-500 min-w-16">{d.day}</span>
                        <div>
                          <p className="font-semibold text-xs text-surface-800 dark:text-white">{d.action}</p>
                          <p className="text-[10px] text-surface-500 mt-0.5">Impact savings: {d.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRecType === 'behavioral_insight' && recommendationResult.insights && (
                  <div className="space-y-4">
                    {recommendationResult.insights.map((ins: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40">
                        <h4 className="font-bold text-xs text-surface-800 dark:text-white mb-1">Pattern: {ins.pattern}</h4>
                        <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">{ins.suggestion}</p>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded">
                          Savings: {ins.potentialSavingsKg} kg CO₂/wk
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!['reduction_advice', 'weekly_plan', 'behavioral_insight'].includes(selectedRecType) || !recommendationResult.insights && !recommendationResult.days && !recommendationResult.recommendations && (
                  <pre className="p-4 bg-surface-900 text-green-400 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(recommendationResult, null, 2)}
                  </pre>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <HelpCircle className="w-12 h-12 text-surface-300 mb-3" />
                <h4 className="font-bold text-sm text-surface-500">No Advice Generated Yet</h4>
                <p className="text-xs text-surface-400 max-w-xs mt-1">
                  Select your advice focus on the left and click "Generate Advice" to receive custom steps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
