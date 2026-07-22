import axios, { AxiosError } from 'axios';
import type { ApiErrorPayload } from '../types';

export const TOKEN_KEY = 'tradeflow_access_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('tradeflow:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export const getApiError = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) return error.response?.data.error?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
};

