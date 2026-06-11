import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { api } from '../../lib/api';

interface ForecastData {
  horizon: string;
  predictions: { date: string; predictedKg: number; lowerBound: number; upperBound: number; confidenceScore: number }[];
  confidence: {
    overall: number;
    dataPointsUsed: number;
    modelAccuracy: number;
    factors: { name: string; impact: string; description: string }[];
  };
  methodology: string;
}

export function PredictionsPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [horizon, setHorizon] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchForecast() {
      setLoading(true);
      setError('');
      try {
        const result = await api.get<ForecastData>(`/predictions?horizon=${horizon}`);
        setData(result);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, [horizon]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Forecast</h1>
          <p className="text-surface-500 dark:text-surface-400">
            AI-powered predictions based on your historical data
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Forecast horizon">
          {(['week', 'month'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={h === horizon ? 'btn-primary' : 'btn-secondary'}
              role="tab"
              aria-selected={h === horizon}
            >
              {h === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="sr-only">Generating forecast...</span>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm text-surface-500 mt-2">Log more carbon activities to enable forecasting</p>
        </div>
      )}

      {data && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Confidence Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-sm text-surface-500">Overall Confidence</p>
              <p className="text-3xl font-bold gradient-text">{(data.confidence.overall * 100).toFixed(0)}%</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-surface-500">Data Points Used</p>
              <p className="text-3xl font-bold">{data.confidence.dataPointsUsed}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-surface-500">Model Accuracy</p>
              <p className="text-3xl font-bold">{(data.confidence.modelAccuracy * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Predicted Emissions</h2>
            <div className="h-80" role="img" aria-label="Forecast chart with confidence intervals">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.predictions}>
                  <defs>
                    <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBounds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)} kg`,
                      name === 'predictedKg' ? 'Predicted' : name === 'upperBound' ? 'Upper' : 'Lower',
                    ]}
                  />
                  <Area type="monotone" dataKey="upperBound" stroke="transparent" fill="url(#colorBounds)" />
                  <Area type="monotone" dataKey="lowerBound" stroke="transparent" fill="transparent" />
                  <Area type="monotone" dataKey="predictedKg" stroke="#10b981" strokeWidth={2} fill="url(#colorPrediction)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confidence Factors */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Confidence Factors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.confidence.factors.map((factor) => (
                <div key={factor.name} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  {factor.impact === 'positive' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" aria-hidden="true" />
                  ) : factor.impact === 'negative' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" aria-hidden="true" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{factor.name}</p>
                    <p className="text-xs text-surface-500">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-4 italic">Methodology: {data.methodology}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
