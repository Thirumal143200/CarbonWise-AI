import { SUBCATEGORY_LABELS, CATEGORY_ICONS } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { Leaf, Pencil, Trash2 } from 'lucide-react';

export interface CarbonEntry {
  id: string;
  category: string;
  subcategory: string;
  amount: number;
  unit: string;
  emissionsKg: number;
  entryDate: string;
}

interface CarbonTableProps {
  entries: CarbonEntry[];
  handleEdit: (entry: CarbonEntry) => void;
  handleDelete: (id: string) => Promise<void>;
}

export function CarbonTable({ entries, handleEdit, handleDelete }: CarbonTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-surface-500" scope="col">
                Activity
              </th>
              <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">
                Amount
              </th>
              <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">
                CO₂ (kg)
              </th>
              <th className="px-4 py-3 text-right font-medium text-surface-500" scope="col">
                Actions
              </th>
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
                    <span className="badge-success">
                      {CATEGORY_ICONS[entry.category]} {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {SUBCATEGORY_LABELS[entry.subcategory] ?? entry.subcategory}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.amount} {entry.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {entry.emissionsKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="btn-icon text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      aria-label={`Edit entry from ${entry.entryDate}`}
                      title="Edit Entry"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        void handleDelete(entry.id);
                      }}
                      className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Delete entry from ${entry.entryDate}`}
                      title="Delete Entry"
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
  );
}
