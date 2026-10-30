import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, roleHome } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminDepartments from './pages/admin/Departments';
import AdminPatients from './pages/admin/Patients';
import AdminAppointments from './pages/admin/Appointments';
import AdminStaff from './pages/admin/Staff';
import AdminBilling from './pages/admin/Billing';
import AdminReports from './pages/admin/Reports';
import AdminNotifications from './pages/admin/Notifications';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorPatientDetail from './pages/doctor/PatientDetail';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorRecords from './pages/doctor/Records';
import DoctorNotifications from './pages/doctor/Notifications';

import ReceptionDashboard from './pages/receptionist/Dashboard';
import ReceptionPatients from './pages/receptionist/Patients';
import ReceptionDoctors from './pages/receptionist/Doctors';
import ReceptionAppointments from './pages/receptionist/Appointments';
import ReceptionNotifications from './pages/receptionist/Notifications';

import BillingDashboard from './pages/billing/Dashboard';
import BillingToBill from './pages/billing/ToBill';
import BillingInvoices from './pages/billing/Invoices';
import BillingNotifications from './pages/billing/Notifications';

import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import PatientDoctors from './pages/patient/Doctors';
import PatientAppointments from './pages/patient/Appointments';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientRecords from './pages/patient/Records';
import PatientInvoices from './pages/patient/Invoices';
import PatientNotifications from './pages/patient/Notifications';

// "/" sends each user to their own dashboard (or to the login page).
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  return <Navigate to={user ? roleHome[user.role] : '/login'} replace />;
}

// Wraps a role's pages in the role check + sidebar layout.
const area = (role) => (
  <ProtectedRoute roles={[role]}>
    <DashboardLayout role={role} />
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={area('admin')}>
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/doctor" element={area('doctor')}>
        <Route index element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="patients/:id" element={<DoctorPatientDetail />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="records" element={<DoctorRecords />} />
        <Route path="notifications" element={<DoctorNotifications />} />
      </Route>

      <Route path="/receptionist" element={area('receptionist')}>
        <Route index element={<ReceptionDashboard />} />
        <Route path="patients" element={<ReceptionPatients />} />
        <Route path="doctors" element={<ReceptionDoctors />} />
        <Route path="appointments" element={<ReceptionAppointments />} />
        <Route path="notifications" element={<ReceptionNotifications />} />
      </Route>

      <Route path="/billing" element={area('billing')}>
        <Route index element={<BillingDashboard />} />
        <Route path="to-bill" element={<BillingToBill />} />
        <Route path="invoices" element={<BillingInvoices />} />
        <Route path="notifications" element={<BillingNotifications />} />
      </Route>

      <Route path="/patient" element={area('patient')}>
        <Route index element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="doctors" element={<PatientDoctors />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="invoices" element={<PatientInvoices />} />
        <Route path="notifications" element={<PatientNotifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
