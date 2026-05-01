import axios from 'axios';

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
        return Promise.reject(error);
    }
);