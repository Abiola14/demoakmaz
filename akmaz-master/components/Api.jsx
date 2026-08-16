import axios from "axios";

const api = axios.create({
  baseURL: "https://demobackend-production-9620.up.railway.app/api",
  withCredentials: true,
});

export default api;