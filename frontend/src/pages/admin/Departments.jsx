import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty } from '../../components/ui';

export default function Departments() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/departments');
  const [form, setForm] = useState(null);
  const departments = data || [];

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Department name is required');
    try {
      const res = form.id ? await api.put(`/departments/${form.id}`, form) : await api.post('/departments', form);
      toast.success(res.data.message);
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete the ${d.name} department?`)) return;
    try {
      const res = await api.delete(`/departments/${d.id}`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Departments" subtitle="Doctors are assigned to a department on the Doctors page"
        action={<button className="btn-primary" onClick={() => setForm({ name: '', description: '' })}><Plus className="h-4 w-4" /> Add department</button>} />
      <div className="card">
        {loading ? <Spinner /> : departments.length === 0 ? <Empty text="No departments yet. Add the first one." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th>Doctors</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td className="font-medium text-slate-900">{d.name}</td>
                    <td>{d.description || '-'}</td>
                    <td>{d.doctor_count}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline btn-sm" onClick={() => setForm({ ...d })}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => remove(d)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit department' : 'Add department'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Description"><input className="input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary">Save department</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
