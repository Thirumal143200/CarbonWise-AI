import type { Challenge, UserChallenge } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Play, CheckCircle, Flame, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '../../lib/api';


interface ChallengesListResponse {
  challenges: Challenge[];
}

interface ActiveChallengesResponse {
  activeChallenges: UserChallenge[];
}

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [availRes, activeRes] = await Promise.all([
          api.get<ChallengesListResponse>('/challenges'),
          api.get<ActiveChallengesResponse>('/challenges/active'),
        ]);
        setChallenges(availRes.challenges);
        setActiveChallenges(activeRes.activeChallenges);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleJoin = async (id: string) => {
    setError('');
    try {
      await api.post<{ userChallenge: UserChallenge }>(`/challenges/${id}/join`);
      // Re-fetch active challenges
      const activeRes = await api.get<ActiveChallengesResponse>('/challenges/active');
      setActiveChallenges(activeRes.activeChallenges);
      setActiveTab('active');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to join challenge');
    }
  };

  const handleUpdateProgress = async (challengeId: string, currentProgress: number) => {
    setError('');
    try {
      const newProgress = Math.min(100, currentProgress + 10);
      await api.put(`/challenges/${challengeId}/progress`, { progress_pct: newProgress });
      // Re-fetch active challenges
      const activeRes = await api.get<ActiveChallengesResponse>('/challenges/active');
      setActiveChallenges(activeRes.activeChallenges);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to update challenge progress');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
            <span>Eco-Challenges</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Participate in community challenges to gain experience and build sustainable habits.
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
            activeTab === 'available'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
          onClick={() => setActiveTab('available')}
        >
          Available Challenges ({challenges.length})
        </button>
        <button
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Challenges ({activeChallenges.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="sr-only">Loading challenges...</span>
        </div>
      ) : activeTab === 'available' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((c) => {
            const isJoined = activeChallenges.some((ac) => ac.challenge.id === c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold capitalize">
                      {c.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Flame className="w-4 h-4" />
                      <span>{c.xpReward} XP</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-6">
                    {c.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-surface-500">
                    <Calendar className="w-4 h-4" />
                    <span>{c.durationDays} Days</span>
                  </div>

                  {isJoined ? (
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Joined
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(c.id)}
                      className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Join
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : activeChallenges.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-emerald-500/20" />
          <h3 className="text-xl font-bold mb-2">No Active Challenges</h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Join one of the available challenges to test your habits and earn eco points.
          </p>
          <button onClick={() => setActiveTab('available')} className="btn-primary">
            Explore Challenges
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeChallenges.map((ac) => (
            <motion.div
              key={ac.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{ac.challenge.title}</h3>
                  <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {ac.challenge.xpReward} XP
                  </span>
                </div>

                <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
                  {ac.challenge.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-surface-500">Progress</span>
                    <span>{ac.progressPct}%</span>
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ac.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <span className="text-xs text-surface-500">
                  Ends: {new Date(ac.endsAt).toLocaleDateString()}
                </span>

                {ac.progressPct >= 100 ? (
                  <span className="text-emerald-500 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                    <CheckCircle className="w-4 h-4" /> Completed!
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpdateProgress(ac.challenge.id, ac.progressPct)}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Increment (+10%)
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
