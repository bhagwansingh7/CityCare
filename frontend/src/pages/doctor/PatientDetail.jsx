import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardPlus, Pill, Pencil, Plus, Trash2, Check } from 'lucide-react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, StatusBadge, fmtDate, fmtTime, ageFrom } from '../../components/ui';

const blankItem = { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function PatientDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const toast = useToast();
  const apptFromUrl = params.get('appointment') || '';

  const { data: patient, loading } = useFetch(`/patients/${id}`);
  const { data: records, reload: reloadRecords } = useFetch('/medical-records', { patient_id: id });
  const { data: prescriptions, reload: reloadRx } = useFetch('/prescriptions', { patient_id: id });
  const { data: appts, reload: reloadAppts } = useFetch('/appointments', { patient_id: id });

  const [recordForm, setRecordForm] = useState(null);
  const [rxForm, setRxForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const myAppts = appts || [];
  const currentAppt = myAppts.find((a) => String(a.id) === apptFromUrl);

  const apptOptions = (
    <>
      <option value="">Not linked to an appointment</option>
      {myAppts.map((a) => <option key={a.id} value={a.id}>{fmtDate(a.appointment_date)} {fmtTime(a.appointment_time)} ({a.status})</option>)}
    </>
  );

  const saveRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.diagnosis.trim()) return toast.error('Enter a diagnosis');
    setBusy(true);
    try {
      const body = { ...recordForm, patient_id: Number(id) };
      const res = recordForm.id ? await api.put(`/medical-records/${recordForm.id}`, body) : await api.post('/medical-records', body);
      toast.success(res.data.message);
      setRecordForm(null);
      reloadRecords();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const saveRx = async (e) => {
    e.preventDefault();
    if (rxForm.items.some((i) => !i.medicine_name.trim() || !i.dosage.trim())) return toast.error('Each medicine needs a name and a dosage');
    setBusy(true);
    try {
      const res = await api.post('/prescriptions', { ...rxForm, patient_id: Number(id) });
      toast.success(res.data.message);
      setRxForm(null);
      reloadRx();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const setItem = (idx, k, v) => setRxForm({ ...rxForm, items: rxForm.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) });

  const markCompleted = async () => {
    try {
      const res = await api.put(`/appointments/${currentAppt.id}/status`, { status: 'Completed' });
      toast.success(res.data.message);
      reloadAppts();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (loading || !patient) return <Spinner />;

  return (
    <>
      <Link to="/doctor/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ArrowLeft className="h-4 w-4" /> All patients</Link>
      <PageHeader title={patient.name} subtitle={`${patient.gender}, ${ageFrom(patient.date_of_birth)} years - ${patient.phone || 'no phone'}`}
        action={
          <div className="flex flex-wrap gap-2">
            {currentAppt && currentAppt.status !== 'Completed' && <button className="btn-outline" onClick={markCompleted}><Check className="h-4 w-4" /> Mark appointment completed</button>}
            <button className="btn-outline" onClick={() => setRecordForm({ diagnosis: '', treatment_notes: '', appointment_id: apptFromUrl })}><ClipboardPlus className="h-4 w-4" /> Add medical record</button>
            <button className="btn-primary" onClick={() => setRxForm({ appointment_id: apptFromUrl, notes: '', items: [{ ...blankItem }] })}><Pill className="h-4 w-4" /> New prescription</button>
          </div>
        } />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-3 font-semibold text-slate-900">Patient information</h2>
          <dl className="space-y-2 text-sm">
            {[['Email', patient.email], ['Date of birth', fmtDate(patient.date_of_birth)], ['Address', patient.address], ['Emergency contact', patient.emergency_contact]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-slate-800">{v || '-'}</dd></div>
            ))}
          </dl>
          <h2 className="mb-2 mt-5 font-semibold text-slate-900">Your appointments</h2>
          {myAppts.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : (
            <ul className="space-y-2 text-sm">
              {myAppts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2"><span>{fmtDate(a.appointment_date)} {fmtTime(a.appointment_time)}</span><StatusBadge status={a.status} /></li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h2 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">Medical history</h2>
            {!records ? <Spinner /> : records.length === 0 ? <Empty text="No medical records yet." /> : (
              <ul className="divide-y divide-slate-100">
                {records.map((r) => (
                  <li key={r.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900">{r.diagnosis}</h3>
                      <span className="text-sm text-slate-500">{fmtDate(r.record_date)}</span>
                    </div>
                    <p className="text-xs text-slate-500">Dr. {r.doctor_name}</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.treatment_notes || 'No treatment notes.'}</p>
                    <button className="btn-outline btn-sm mt-2" onClick={() => setRecordForm({ ...r, appointment_id: r.appointment_id || '' })}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">Previous prescriptions</h2>
            {!prescriptions ? <Spinner /> : prescriptions.length === 0 ? <Empty text="No prescriptions yet." /> : (
              <ul className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <li key={p.id} className="p-5">
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-900">Prescription #{p.id} - Dr. {p.doctor_name}</span><span className="text-slate-500">{fmtDate(p.prescription_date)}</span></div>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                      {p.items.map((i) => <li key={i.id}>{i.medicine_name} {i.dosage}{i.frequency ? `, ${i.frequency}` : ''}{i.duration ? ` for ${i.duration}` : ''}{i.instructions ? ` (${i.instructions})` : ''}</li>)}
                    </ul>
                    {p.notes && <p className="mt-2 text-sm text-slate-600">Note: {p.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!recordForm} onClose={() => setRecordForm(null)} title={recordForm?.id ? 'Edit medical record' : 'Add medical record'} wide>
        {recordForm && (
          <form onSubmit={saveRecord} className="space-y-4">
            <Field label="Diagnosis"><input className="input" value={recordForm.diagnosis} onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })} /></Field>
            <Field label="Treatment notes"><textarea rows="5" className="input" value={recordForm.treatment_notes || ''} onChange={(e) => setRecordForm({ ...recordForm, treatment_notes: e.target.value })} /></Field>
            {!recordForm.id && <Field label="Appointment"><select className="input" value={recordForm.appointment_id} onChange={(e) => setRecordForm({ ...recordForm, appointment_id: e.target.value })}>{apptOptions}</select></Field>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setRecordForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save record'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!rxForm} onClose={() => setRxForm(null)} title="New prescription" wide>
        {rxForm && (
          <form onSubmit={saveRx} className="space-y-4">
            <Field label="Appointment"><select className="input" value={rxForm.appointment_id} onChange={(e) => setRxForm({ ...rxForm, appointment_id: e.target.value })}>{apptOptions}</select></Field>
            {rxForm.items.map((it, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Medicine {idx + 1}</p>
                  {rxForm.items.length > 1 && <button type="button" className="text-slate-400 hover:text-red-600" aria-label="Remove medicine" onClick={() => setRxForm({ ...rxForm, items: rxForm.items.filter((_, i) => i !== idx) })}><Trash2 className="h-4 w-4" /></button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" placeholder="Medicine name" value={it.medicine_name} onChange={(e) => setItem(idx, 'medicine_name', e.target.value)} aria-label="Medicine name" />
                  <input className="input" placeholder="Dosage (e.g. 500 mg)" value={it.dosage} onChange={(e) => setItem(idx, 'dosage', e.target.value)} aria-label="Dosage" />
                  <input className="input" placeholder="Frequency (e.g. twice daily)" value={it.frequency} onChange={(e) => setItem(idx, 'frequency', e.target.value)} aria-label="Frequency" />
                  <input className="input" placeholder="Duration (e.g. 5 days)" value={it.duration} onChange={(e) => setItem(idx, 'duration', e.target.value)} aria-label="Duration" />
                  <input className="input sm:col-span-2" placeholder="Instructions (e.g. after meals)" value={it.instructions} onChange={(e) => setItem(idx, 'instructions', e.target.value)} aria-label="Instructions" />
                </div>
              </div>
            ))}
            <button type="button" className="btn-outline btn-sm" onClick={() => setRxForm({ ...rxForm, items: [...rxForm.items, { ...blankItem }] })}><Plus className="h-3.5 w-3.5" /> Add another medicine</button>
            <Field label="Notes for the patient (optional)"><input className="input" value={rxForm.notes} onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setRxForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save prescription'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
