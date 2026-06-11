import { CARBON_CATEGORIES, SUBCATEGORIES, SUBCATEGORY_LABELS, SUBCATEGORY_UNITS, CATEGORY_ICONS } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { Plus, Trash2, Leaf } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { api, ApiError } from '../../lib/api';

interface CarbonEntry {
  id: string;
  category: string;
  subcategory: string;
  amount: number;
  unit: string;
  emissionsKg: number;
  entryDate: string;
}

export function CarbonPage() {
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('transportation');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchEntries();
  }, []);

  useEffect(() => {
    const subs = SUBCATEGORIES[category as keyof typeof SUBCATEGORIES];
    if (subs && subs.length > 0) setSubcategory(subs[0]);
  }, [category]);

  async function fetchEntries() {
    try {
      const data = await api.get<{ entries: CarbonEntry[] }>('/carbon?limit=50');
      setEntries(data.entries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const unit = SUBCATEGORY_UNITS[subcategory] ?? 'kg';
      await api.post('/carbon', {
        category,
        subcategory,
        amount: parseFloat(amount),
        unit,
        entryDate,
      });
      setShowForm(false);
      setAmount('');
      await fetchEntries();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/carbon/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <span className="sr-only">Loading entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Log</h1>
          <p className="text-surface-500 dark:text-surface-400">Track your daily carbon emissions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" aria-expanded={showForm}>
          <Plus className="w-5 h-5" aria-hidden="true" />
          Log Activity
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">New Carbon Entry</h2>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Log carbon entry">
            {error && (
              <div className="col-span-full p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="entry-category" className="input-label">Category</label>
              <select
                id="entry-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {CARBON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="entry-subcategory" className="input-label">Activity</label>
              <select
                id="entry-subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="input-field"
              >
                {((SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] ?? []) as readonly string[]).map((sub: string) => (
                  <option key={sub} value={sub}>
                    {SUBCATEGORY_LABELS[sub] ?? sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="entry-amount" className="input-label">
                Amount ({SUBCATEGORY_UNITS[subcategory] ?? 'units'})
              </label>
              <input
                id="entry-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="e.g., 30"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label htmlFor="entry-date" className="input-label">Date</label>
              <input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="col-span-full flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting || !amount} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Entries List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">Date</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">Category</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">Activity</th>
                <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">Amount</th>
                <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">CO₂ (kg)</th>
                <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-surface-400">
                    <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No entries yet</p>
                    <p className="text-sm">Start logging your carbon activities above</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">{entry.entryDate}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="badge-success">{CATEGORY_ICONS[entry.category]} {entry.category}</span>
                    </td>
                    <td className="px-4 py-3">{SUBCATEGORY_LABELS[entry.subcategory] ?? entry.subcategory}</td>
                    <td className="px-4 py-3 text-right">{entry.amount} {entry.unit}</td>
                    <td className="px-4 py-3 text-right font-medium">{entry.emissionsKg.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { void handleDelete(entry.id); }}
                        className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label={`Delete entry from ${entry.entryDate}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
