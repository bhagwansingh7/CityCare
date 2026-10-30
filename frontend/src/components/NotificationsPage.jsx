import { Bell } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import useFetch from '../api/useFetch';
import { useToast } from '../context/ToastContext';
import { PageHeader, Spinner, Empty, fmtDateTime } from './ui';

export default function NotificationsPage() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/notifications');
  const list = data?.notifications || [];

  const markRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const markAll = async () => {
    try { await api.put('/notifications/read-all'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <PageHeader title="Notifications" subtitle={`${data?.unread || 0} unread`}
        action={(data?.unread || 0) > 0 && <button className="btn-outline" onClick={markAll}>Mark all as read</button>} />
      <div className="card divide-y divide-slate-100">
        {loading ? <Spinner /> : list.length === 0 ? <Empty text="You have no notifications." /> : list.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 ${n.is_read ? '' : 'bg-blue-50/50'}`}>
            <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.is_read ? 'text-slate-400' : 'text-blue-600'}`} />
            <div className="flex-1">
              <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>{n.message}</p>
              <p className="text-xs text-slate-500">{fmtDateTime(n.created_at)}</p>
            </div>
            {!n.is_read && <button className="btn-outline btn-sm" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        ))}
      </div>
    </>
  );
}
