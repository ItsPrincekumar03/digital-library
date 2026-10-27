const hostname = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";

export const API_BASE_URL = `http://${hostname}:5000/api`;

export const FRONTEND_BASE_URL = `http://${hostname}:3000`;

export const API_ENDPOINTS = Object.freeze({
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me"
});
