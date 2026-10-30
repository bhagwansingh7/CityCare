export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isTime = (v) => typeof v === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
export const normTime = (t) => (t && t.length === 5 ? `${t}:00` : t);
export const money = (n) => Math.round(Number(n) * 100) / 100;
