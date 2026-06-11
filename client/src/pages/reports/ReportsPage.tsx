import { FileText, Download, Sparkles, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

import { api } from '../../lib/api';

export function ReportsPage() {
  const [datePreset, setDatePreset] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      let finalFrom = from;
      let finalTo = to;

      if (datePreset !== 'custom') {
        const days = parseInt(datePreset, 10);
        const d = new Date();
        d.setDate(d.getDate() - days);
        finalFrom = d.toISOString().split('T')[0]!;
        finalTo = new Date().toISOString().split('T')[0]!;
      }

      const response = await api.get<Response>(`/reports/generate?from=${finalFrom}&to=${finalTo}`);
      // The api client returns the raw Response for non-JSON content types
      const rawResponse = response as unknown as Response;
      const blob = await rawResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', `carbonwise-report-${finalFrom}-to-${finalTo}.pdf`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to download report PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <FileText className="w-8 h-8 text-emerald-500" />
          <span>Sustainability Reports</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Export full PDF statements summarizing your carbon log trends and AI recommendations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-lg">Configure Export Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="input-label">Date Range Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '7', label: '7 Days' },
                  { value: '30', label: '30 Days' },
                  { value: '90', label: '90 Days' },
                  { value: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setDatePreset(item.value as typeof datePreset)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      datePreset === item.value
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-surface-200 dark:border-surface-800 hover:border-surface-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="input-label" htmlFor="report-from">From Date</label>
                  <input
                    type="date"
                    id="report-from"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="input-field py-2.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="report-to">To Date</label>
                  <input
                    type="date"
                    id="report-to"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="input-field py-2.5 text-xs font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { void handleDownload(); }}
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export PDF Statement</span>
              </>
            )}
          </button>
        </div>

        {/* Side Panel Guidance */}
        <div className="glass-card p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Sparkles className="w-5 h-5" />
            <span>Premium PDF Reports</span>
          </div>
          <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
            Our PDFKit report generation engine aggregates your logs, draws trend graphs, evaluates eco scores,
            and appends standard carbon footprint reduction tips.
          </p>
          <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-start gap-2.5 text-xs text-surface-500">
            <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>
              All reports are optimized for offline reading and presentation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
