import axios from "axios";

// אם יש לך .env בפרונט: VITE_API_URL=http://127.0.0.1:5000
const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // אם השרת החזיר 401 – נמחק טוקן ונחזיר ללוגין
    if (err?.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("currentUser");
    }
    return Promise.reject(err);
  }
);


export default api;
