// src/api.js
import axios from "axios";

const api = axios.create({
baseURL: "https://demobackend-production-5e49.up.railway.app/api",
  withCredentials: true,
});

export default api;