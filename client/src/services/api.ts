import axios from 'axios';

// Vite מושך את הכתובת מה-env, או משתמש בלוקאל כברירת מחדל
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// הוספת ה-Token באופן אוטומטי לכל בקשה (Interceptors)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// עכשיו את יכולה להשתמש בזה פשוט ככה:
// const response = await api.post('/auth/login', { email, password });
// return response.data;