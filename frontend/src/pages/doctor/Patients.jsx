import PatientsManager from '../../components/PatientsManager';

export default function Patients() {
  return <PatientsManager detailPath={(id) => `/doctor/patients/${id}`} />;
}
