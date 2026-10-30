import axios from 'axios';

// withCredentials lets the browser send/receive the HTTP-only JWT cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Pulls a readable message out of an Axios error.
export const errMsg = (err) =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong');

export default api;
