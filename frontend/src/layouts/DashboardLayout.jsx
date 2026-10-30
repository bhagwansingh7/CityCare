import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { HeartPulse, LogOut, Menu, Bell } from 'lucide-react';
import { navConfig } from './navConfig';
import { useAuth, roleLabel, roleHome } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

// One layout for all roles; the sidebar links come from navConfig[role].
export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Close the mobile menu and refresh the unread badge on every page change.
  useEffect(() => {
    setMenuOpen(false);
    api.get('/notifications').then((res) => setUnread(res.data.unread)).catch(() => {});
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {menuOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to={roleHome[role]} className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><HeartPulse className="h-5 w-5" /></span>
          <span>
            <span className="block text-base font-semibold leading-tight text-slate-900">CityCare</span>
            <span className="block text-xs text-slate-500">Hospital management</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
          {navConfig[role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <p className="hidden text-sm text-slate-500 sm:block">{roleLabel[role]} portal</p>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to={`${roleHome[role]}/notifications`} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">{unread}</span>}
            </Link>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">{user.name.charAt(0)}</span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{roleLabel[user.role]}</p>
              </div>
              <button onClick={handleLogout} className="btn-outline btn-sm ml-1"><LogOut className="h-3.5 w-3.5" /> Log out</button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
