import { useEffect, useState } from 'react';
import api, { errMsg } from './axios';
import { useToast } from '../context/ToastContext';

// Loads data from the API. Re-fetches when url/params change or when reload() is called.
export default function useFetch(url, params = {}, enabled = true) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    api
      .get(url, { params: JSON.parse(key) })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) toast.error(errMsg(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url, key, tick, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, reload: () => setTick((t) => t + 1) };
}
