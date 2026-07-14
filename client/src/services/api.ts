import axios from 'axios';
import { invalidateSession } from '../lib/stored-user';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const OBSERVABILITY_ENABLED =
  import.meta.env.VITE_OBSERVABILITY_LOGS !== 'false';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (OBSERVABILITY_ENABLED) {
        (config as typeof config & { metadata?: { startedAt: number } }).metadata = {
            startedAt: performance.now(),
        };
    }
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        if (OBSERVABILITY_ENABLED) {
            const startedAt = (response.config as typeof response.config & {
                metadata?: { startedAt: number };
            }).metadata?.startedAt;
            const durationMs =
                typeof startedAt === 'number' ? Math.round(performance.now() - startedAt) : null;
            console.info(
                '[client] API success',
                response.config.method?.toUpperCase(),
                response.config.url,
                `status=${response.status}`,
                durationMs !== null ? `durationMs=${durationMs}` : ''
            );
        }
        return response;
    },
    (error) => {
        if (OBSERVABILITY_ENABLED) {
            const cfg = error?.config as
                | (typeof error.config & { metadata?: { startedAt: number } })
                | undefined;
            const startedAt = cfg?.metadata?.startedAt;
            const durationMs =
                typeof startedAt === 'number' ? Math.round(performance.now() - startedAt) : null;
            console.error(
                '[client] API error',
                cfg?.method?.toUpperCase(),
                cfg?.url,
                `status=${error?.response?.status ?? 'unknown'}`,
                durationMs !== null ? `durationMs=${durationMs}` : '',
                error?.response?.data ?? error?.message
            );
        }
        const payload = error?.response?.data as
            | { code?: string }
            | undefined;
        if (
            localStorage.getItem('token') &&
            (payload?.code === 'SESSION_INVALID' ||
                payload?.code === 'SESSION_INACTIVE')
        ) {
            invalidateSession(
                payload.code === 'SESSION_INACTIVE'
                    ? 'Your account is no longer active. Please contact an administrator.'
                    : 'Your session expired or became invalid. Please sign in again.'
            );
        }
        return Promise.reject(error);
    }
);
