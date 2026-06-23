import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sampleApi } from './sampleApi';
import type { SampleItem } from './types';

export default function SampleEditPage() {
  const { mode, uuid } = useParams<{ mode: string; uuid?: string }>();
  const isNew = mode === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['sample', uuid],
    queryFn: () => sampleApi.get(uuid!),
    enabled: !isNew && !!uuid,
  });

  const [form, setForm] = useState<Omit<SampleItem, 'uuid'>>({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (data) setForm({ name: data.name, description: data.description ?? '', status: data.status });
  }, [data]);

  const save = useMutation({
    mutationFn: () => (isNew ? sampleApi.create(form) : sampleApi.update(uuid!, form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sample'] });
      navigate('/sample');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{isNew ? 'New' : 'Edit'} sample</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SampleItem['status'] }))}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/sample')} className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-alt">
            Cancel
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
