import axios from "axios";
import { useAuthStore } from "../store/authStore";

const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

const publicHttp = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

http.interceptors.request.use(function (config) {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
});

export { publicHttp };
export default http;