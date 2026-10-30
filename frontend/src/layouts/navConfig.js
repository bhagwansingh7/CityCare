import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarDays, FileText, Pill, Receipt,
  Bell, UserCog, BarChart3, ClipboardList, User, ClipboardPlus,
} from 'lucide-react';

// Sidebar links for each role. `end: true` means the link is active only on its exact path.
export const navConfig = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/admin/staff', label: 'Staff accounts', icon: UserCog },
    { to: '/admin/billing', label: 'Billing', icon: Receipt },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/appointments', label: 'My appointments', icon: CalendarDays },
    { to: '/doctor/patients', label: 'Patients', icon: Users },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/doctor/records', label: 'Medical records', icon: ClipboardList },
    { to: '/doctor/notifications', label: 'Notifications', icon: Bell },
  ],
  receptionist: [
    { to: '/receptionist', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/receptionist/patients', label: 'Patients', icon: Users },
    { to: '/receptionist/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/receptionist/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/receptionist/notifications', label: 'Notifications', icon: Bell },
  ],
  billing: [
    { to: '/billing', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/billing/to-bill', label: 'Appointments to bill', icon: ClipboardPlus },
    { to: '/billing/invoices', label: 'Invoices', icon: Receipt },
    { to: '/billing/notifications', label: 'Notifications', icon: Bell },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patient/profile', label: 'My profile', icon: User },
    { to: '/patient/doctors', label: 'Find a doctor', icon: Stethoscope },
    { to: '/patient/appointments', label: 'My appointments', icon: CalendarDays },
    { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/patient/records', label: 'Medical records', icon: FileText },
    { to: '/patient/invoices', label: 'Invoices', icon: Receipt },
    { to: '/patient/notifications', label: 'Notifications', icon: Bell },
  ],
};
