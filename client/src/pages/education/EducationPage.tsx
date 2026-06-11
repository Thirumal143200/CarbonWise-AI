import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, HelpCircle, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '../../lib/api';

interface Article {
  id: string;
  title: string;
  contentType: string;
  difficulty: string;
  readTimeMinutes: number;
  slug: string;
  createdAt: string;
}

interface ArticleDetail extends Article {
  body: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  xpReward: number;
}

export function EducationPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Article Detail State
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [_detailLoading, setDetailLoading] = useState(false);

  // Quiz submission state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, { correct: boolean; correctIndex: number; xpEarned: number }>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      setError('');
      try {
        const result = await api.get<{ content: Article[] }>('/education');
        setArticles(result.content);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Failed to load education hub articles');
      } finally {
        setLoading(false);
      }
    }
    void fetchArticles();
  }, []);

  const handleSelectArticle = async (slug: string) => {
    setDetailLoading(true);
    setError('');
    setSelectedArticle(null);
    setQuizQuestions([]);
    setSelectedAnswers({});
    setQuizFeedback({});
    try {
      const res = await api.get<{ content: ArticleDetail; quiz: QuizQuestion[] }>(`/education/${slug}`);
      setSelectedArticle(res.content);
      setQuizQuestions(res.quiz);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to load article detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOptionSelect = (qId: string, optIdx: number) => {
    if (quizFeedback[qId]) return; // Answered already
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitQuizAnswer = async (qId: string) => {
    const selectedIdx = selectedAnswers[qId];
    if (selectedIdx === undefined) return;

    setSubmittingQuiz((prev) => ({ ...prev, [qId]: true }));
    try {
      const res = await api.post<{ correct: boolean; xpEarned: number; correctIndex: number }>(
        `/education/quiz/${qId}/answer`,
        { selected_index: selectedIdx }
      );
      setQuizFeedback((prev) => ({
        ...prev,
        [qId]: { correct: res.correct, correctIndex: res.correctIndex, xpEarned: res.xpEarned },
      }));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to submit quiz answer');
    } finally {
      setSubmittingQuiz((prev) => ({ ...prev, [qId]: false }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-500" />
          <span>Education Hub</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Learn about climate change solutions and take quick quizzes to earn XP.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="sr-only">Loading articles...</span>
        </div>
      ) : selectedArticle ? (
        /* Article detail view */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hub</span>
          </button>

          <div className="glass-card p-6 md:p-8 space-y-6">
            <div>
              <div className="flex gap-2 text-xs font-semibold mb-2">
                <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded capitalize">
                  {selectedArticle.contentType}
                </span>
                <span className="bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-2.5 py-0.5 rounded capitalize">
                  {selectedArticle.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
              <div className="flex items-center gap-1.5 text-xs text-surface-500 mt-1">
                <Clock className="w-4 h-4" />
                <span>{selectedArticle.readTimeMinutes} mins read</span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300 leading-relaxed">
              {selectedArticle.body.split('\n\n').map((para, idx) => (
                <p key={idx} className="mb-4">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Quizzes list */}
          {quizQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <span>Quick Knowledge Check</span>
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {quizQuestions.map((q) => {
                  const feedback = quizFeedback[q.id];
                  const selectedIdx = selectedAnswers[q.id];
                  const isAnswered = !!feedback;

                  return (
                    <div key={q.id} className="glass-card p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base">{q.question}</h4>
                        <span className="bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded text-xs font-semibold">
                          +{q.xpReward} XP
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedIdx === oIdx;
                          const isCorrectOption = isAnswered && oIdx === feedback.correctIndex;
                          const isWrongSelection = isAnswered && isSelected && !feedback.correct;

                          let btnClass = 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900';
                          if (isSelected) btnClass = 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20';
                          if (isCorrectOption) btnClass = 'border-green-500 bg-green-500/25 dark:bg-green-950/20';
                          if (isWrongSelection) btnClass = 'border-red-500 bg-red-500/25 dark:bg-red-950/20';

                          return (
                            <button
                              key={oIdx}
                              disabled={isAnswered}
                              onClick={() => handleOptionSelect(q.id, oIdx)}
                              className={`text-left p-4 rounded-xl border text-xs font-semibold transition-all ${btnClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {!isAnswered ? (
                        <button
                          onClick={() => { void handleSubmitQuizAnswer(q.id); }}
                          disabled={selectedIdx === undefined || submittingQuiz[q.id]}
                          className="btn-primary py-2 px-5 text-xs self-start"
                        >
                          {submittingQuiz[q.id] ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      ) : (
                        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          feedback.correct ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                        }`}>
                          {feedback.correct ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Correct! Earned +{feedback.xpEarned} XP.</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5" />
                              <span>Incorrect. Better luck next time!</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* Hub Articles List view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => { void handleSelectArticle(article.slug); }}
              className="text-left glass-card p-6 flex flex-col justify-between hover:shadow-card-hover hover:border-surface-300 dark:hover:border-surface-700 transition-all cursor-pointer"
            >
              <div>
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                    {article.contentType}
                  </span>
                  <span className="bg-surface-100 dark:bg-surface-800 text-surface-500 px-2 py-0.5 rounded">
                    {article.difficulty}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-surface-900 dark:text-white leading-snug mb-3">
                  {article.title}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800 w-full mt-6">
                <div className="flex items-center gap-1 text-xs text-surface-500">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTimeMinutes} min</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
