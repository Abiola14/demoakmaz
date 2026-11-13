
import axios from "axios";

const api = axios.create({
    baseURL: "https://demobackend-production-5e49.up.railway.app/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach JWT token automatically when available.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
