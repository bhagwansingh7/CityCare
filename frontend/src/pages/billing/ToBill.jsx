import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, fmtDate, fmtMoney } from '../../components/ui';

export default function ToBill() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/invoices/billable-appointments');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data || [];
  const total = form ? Number(form.consultation_charge || 0) + Number(form.other_charges || 0) : 0;

  const open = (a) => setForm({ appointment_id: a.appointment_id, patient_name: a.patient_name, doctor_name: a.doctor_name, consultation_charge: a.consultation_fee, other_charges: 0, other_charges_description: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (total <= 0) return toast.error('The invoice total must be greater than zero');
    setBusy(true);
    try {
      const res = await api.post('/invoices', form);
      toast.success(res.data.message);
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Appointments to bill" subtitle="Completed appointments that do not have an invoice yet" />
      <div className="card">
        {loading ? <Spinner /> : rows.length === 0 ? <Empty text="All completed appointments have been billed." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Consultation fee</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.appointment_id}>
                    <td>{fmtDate(a.appointment_date)}</td><td className="font-medium text-slate-900">{a.patient_name}</td>
                    <td>Dr. {a.doctor_name}</td><td>{a.reason || '-'}</td><td>{fmtMoney(a.consultation_fee)}</td>
                    <td className="text-right"><button className="btn-primary btn-sm" onClick={() => open(a)}><FilePlus2 className="h-3.5 w-3.5" /> Generate invoice</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title="Generate invoice">
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">{form.patient_name} - visit with Dr. {form.doctor_name}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Consultation charge (₹)"><input type="number" min="0" step="0.01" className="input" value={form.consultation_charge} onChange={(e) => setForm({ ...form, consultation_charge: e.target.value })} /></Field>
              <Field label="Other charges (₹)"><input type="number" min="0" step="0.01" className="input" value={form.other_charges} onChange={(e) => setForm({ ...form, other_charges: e.target.value })} /></Field>
            </div>
            <Field label="Other charges description"><input className="input" value={form.other_charges_description} onChange={(e) => setForm({ ...form, other_charges_description: e.target.value })} placeholder="For example: ECG, lab tests, dressing" /></Field>
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900">Total: {fmtMoney(total)}</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Generating...' : 'Generate invoice'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
