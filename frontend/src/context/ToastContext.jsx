import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const add = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const value = useMemo(() => ({
    success: (m) => add('success', m),
    error: (m) => add('error', m),
  }), [add]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`flex items-start gap-2 rounded-lg border bg-white p-3 text-sm shadow-lg ${t.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
            {t.type === 'success'
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
            <p className="flex-1 text-slate-700">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
