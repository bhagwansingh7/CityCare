import useFetch from '../api/useFetch';
import { PageHeader, Spinner, Empty, fmtDate } from './ui';

// Prescriptions as cards. Patients see their own; doctors see the ones they wrote; admin sees all.
export default function PrescriptionsList({ role }) {
  const { data, loading } = useFetch('/prescriptions');
  const list = data || [];
  return (
    <>
      <PageHeader title="Prescriptions" subtitle={role === 'patient' ? 'Medicines prescribed to you' : 'Prescriptions you have written'} />
      {loading ? <Spinner /> : list.length === 0 ? <div className="card"><Empty text="No prescriptions yet." /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Prescription #{p.id}</h3>
                  <p className="text-sm text-slate-500">{role === 'patient' ? `Dr. ${p.doctor_name}` : `Patient: ${p.patient_name}`}</p>
                </div>
                <span className="text-sm text-slate-500">{fmtDate(p.prescription_date)}</span>
              </div>
              <div className="table-wrap mt-3">
                <table className="table">
                  <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                  <tbody>
                    {p.items.map((i) => (
                      <tr key={i.id}>
                        <td className="font-medium text-slate-900">{i.medicine_name}{i.instructions && <span className="block text-xs font-normal text-slate-500">{i.instructions}</span>}</td>
                        <td>{i.dosage}</td><td>{i.frequency || '-'}</td><td>{i.duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {p.notes && <p className="mt-3 text-sm text-slate-600">Note: {p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
