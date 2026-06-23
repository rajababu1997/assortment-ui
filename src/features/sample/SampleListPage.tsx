import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sampleApi } from './sampleApi';
import { Plus, Trash2, Pencil } from 'lucide-react';

const QUERY_KEY = ['sample'];

export default function SampleListPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: QUERY_KEY, queryFn: sampleApi.list });
  const remove = useMutation({
    mutationFn: (uuid: string) => sampleApi.remove(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sample</h1>
        <Link
          to="/sample/new"
          className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-on-secondary">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-danger">Failed to load. Check API at /sample.</p>
        ) : !data?.length ? (
          <p className="p-6 text-sm text-on-secondary">No items.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-on-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.uuid} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        item.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-secondary">{item.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/sample/edit/${item.uuid}`} className="inline-flex items-center p-1 hover:text-primary" aria-label="Edit">
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove.mutate(item.uuid)}
                      className="inline-flex items-center p-1 hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
