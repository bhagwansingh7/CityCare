import { useState } from 'react';
import { Eye, Wallet, Ban } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import useFetch from '../api/useFetch';
import { useToast } from '../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, StatusBadge, fmtDate, fmtDateTime, fmtMoney } from './ui';

const STATUSES = ['Pending', 'Partially Paid', 'Paid', 'Cancelled'];

// Invoice list for billing staff (can record payments), admin (view only) and patients (own invoices only).
export default function InvoicesManager({ role }) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useFetch('/invoices', { status });
  const [detail, setDetail] = useState(null);
  const [pay, setPay] = useState(null);
  const [busy, setBusy] = useState(false);
  const canPay = role === 'billing';
  const invoices = data || [];

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`/invoices/${pay.id}/payments`, { amount: pay.amount, method: pay.method });
      toast.success(res.data.message);
      setPay(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const cancelInvoice = async (inv) => {
    if (!window.confirm(`Cancel invoice #${inv.id}?`)) return;
    try {
      const res = await api.put(`/invoices/${inv.id}/cancel`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Invoices" subtitle={role === 'patient' ? 'Your bills and payment status' : 'Pending and paid invoices'} />
      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All invoices</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {loading ? <Spinner /> : invoices.length === 0 ? <Empty text="No invoices found." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Invoice</th>{role !== 'patient' && <th>Patient</th>}<th>Visit date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium text-slate-900">#{inv.id}</td>
                    {role !== 'patient' && <td>{inv.patient_name}</td>}
                    <td>{fmtDate(inv.appointment_date)}</td>
                    <td>{fmtMoney(inv.total_amount)}</td>
                    <td>{fmtMoney(inv.amount_paid)}</td>
                    <td>{inv.status === 'Cancelled' ? '-' : fmtMoney(inv.balance)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline btn-sm" onClick={() => openDetail(inv.id)}><Eye className="h-3.5 w-3.5" /> View</button>
                        {canPay && ['Pending', 'Partially Paid'].includes(inv.status) && (
                          <button className="btn-primary btn-sm" onClick={() => setPay({ id: inv.id, amount: inv.balance, method: 'Cash', balance: inv.balance })}><Wallet className="h-3.5 w-3.5" /> Record payment</button>
                        )}
                        {canPay && inv.status === 'Pending' && <button className="btn-danger btn-sm" onClick={() => cancelInvoice(inv)}><Ban className="h-3.5 w-3.5" /> Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Invoice #${detail.id}` : ''}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">{detail.patient_name}</span><StatusBadge status={detail.status} /></div>
            <div className="rounded-lg border border-slate-200">
              {[['Consultation charge', detail.consultation_charge],
                [`Other charges${detail.other_charges_description ? ` (${detail.other_charges_description})` : ''}`, detail.other_charges]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 px-3 py-2"><span>{k}</span><span>{fmtMoney(v)}</span></div>
              ))}
              <div className="flex justify-between bg-slate-50 px-3 py-2 font-semibold"><span>Total</span><span>{fmtMoney(detail.total_amount)}</span></div>
              <div className="flex justify-between px-3 py-2"><span>Paid</span><span>{fmtMoney(detail.amount_paid)}</span></div>
              <div className="flex justify-between px-3 py-2 font-medium text-blue-700"><span>Balance</span><span>{detail.status === 'Cancelled' ? '-' : fmtMoney(detail.balance)}</span></div>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-slate-900">Payment history</h3>
              {detail.payments.length === 0 ? <p className="text-slate-500">No payments recorded yet.</p> : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {detail.payments.map((p) => (
                    <li key={p.id} className="flex justify-between px-3 py-2"><span>{fmtDateTime(p.paid_at)} - {p.method}</span><span className="font-medium">{fmtMoney(p.amount)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!pay} onClose={() => setPay(null)} title={pay ? `Record payment for invoice #${pay.id}` : ''}>
        {pay && (
          <form onSubmit={submitPayment} className="space-y-4">
            <p className="text-sm text-slate-600">Balance due: <span className="font-semibold text-slate-900">{fmtMoney(pay.balance)}</span></p>
            <Field label="Amount (₹)"><input type="number" min="1" step="0.01" max={pay.balance} className="input" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="Payment method">
              <select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}><option>Cash</option><option>Card</option><option>UPI</option></select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setPay(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Record payment'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
