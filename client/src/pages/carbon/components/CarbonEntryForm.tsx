import {
  CARBON_CATEGORIES,
  SUBCATEGORIES,
  SUBCATEGORY_LABELS,
  SUBCATEGORY_UNITS,
  CATEGORY_ICONS,
} from '@carbonwise/shared';
import type { FormEvent } from 'react';

interface CarbonEntryFormProps {
  editingId: string | null;
  category: string;
  setCategory: (category: string) => void;
  subcategory: string;
  setSubcategory: (subcategory: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  entryDate: string;
  setEntryDate: (date: string) => void;
  error: string;
  submitting: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setShowForm: (show: boolean) => void;
  setEditingId: (id: string | null) => void;
}

export function CarbonEntryForm({
  editingId,
  category,
  setCategory,
  subcategory,
  setSubcategory,
  amount,
  setAmount,
  entryDate,
  setEntryDate,
  error,
  submitting,
  handleSubmit,
  setShowForm,
  setEditingId,
}: CarbonEntryFormProps) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">
        {editingId ? 'Edit Carbon Entry' : 'New Carbon Entry'}
      </h2>
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Log carbon entry"
      >
        {error && (
          <div
            className="col-span-full p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="entry-category" className="input-label">
            Category
          </label>
          <select
            id="entry-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
          >
            {CARBON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="entry-subcategory" className="input-label">
            Activity
          </label>
          <select
            id="entry-subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="input-field"
          >
            {(
              (SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] ?? []) as readonly string[]
            ).map((sub: string) => (
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
          <label htmlFor="entry-date" className="input-label">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="input-field"
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="col-span-full flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setAmount('');
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting || !amount} className="btn-primary">
            {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
