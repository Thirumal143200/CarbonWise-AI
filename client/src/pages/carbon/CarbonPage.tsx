import { SUBCATEGORIES, SUBCATEGORY_UNITS } from '@carbonwise/shared';
import { Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { api, ApiError } from '../../lib/api';
import { CarbonEntryForm } from './components/CarbonEntryForm';
import { CarbonTable, type CarbonEntry } from './components/CarbonTable';

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
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchEntries();
  }, []);

  useEffect(() => {
    const subs = SUBCATEGORIES[category as keyof typeof SUBCATEGORIES];
    if (subs && subs.length > 0) {
      setSubcategory(subs[0] || '');
    }
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
      const payload = {
        category,
        subcategory,
        amount: parseFloat(amount),
        unit,
        entryDate,
      };

      if (editingId) {
        await api.put(`/carbon/${editingId}`, payload);
      } else {
        await api.post('/carbon', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setAmount('');
      await fetchEntries();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this carbon entry?')) return;
    try {
      await api.delete(`/carbon/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleEdit(entry: CarbonEntry) {
    setCategory(entry.category);
    setSubcategory(entry.subcategory);
    setAmount(entry.amount.toString());
    setEntryDate(entry.entryDate);
    setEditingId(entry.id);
    setShowForm(true);
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
          <p className="text-surface-500 dark:text-surface-400">
            Track your daily carbon emissions
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Log Activity
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <CarbonEntryForm
          editingId={editingId}
          category={category}
          setCategory={setCategory}
          subcategory={subcategory}
          setSubcategory={setSubcategory}
          amount={amount}
          setAmount={setAmount}
          entryDate={entryDate}
          setEntryDate={setEntryDate}
          error={error}
          submitting={submitting}
          handleSubmit={handleSubmit}
          setShowForm={setShowForm}
          setEditingId={setEditingId}
        />
      )}

      {/* Entries List */}
      <CarbonTable entries={entries} handleEdit={handleEdit} handleDelete={handleDelete} />
    </div>
  );
}
