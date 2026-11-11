const hasWindow = typeof window !== "undefined";
const hostname = hasWindow && window.location?.hostname ? window.location.hostname : "localhost";
const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

function resolveApiBaseUrl() {
    if (hasWindow && typeof window.__DL_API_BASE_URL__ === "string" && window.__DL_API_BASE_URL__.trim()) {
        return window.__DL_API_BASE_URL__.trim().replace(/\/+$/, "");
    }

    if (typeof document !== "undefined") {
        const meta = document.querySelector('meta[name="dl-api-base-url"]');
        const content = meta?.getAttribute("content")?.trim();
        if (content) {
            return content.replace(/\/+$/, "");
        }
    }

    if (isLocalHost) {
        if (hasWindow && window.location?.port === "5000") {
            return `${window.location.origin}/api`;
        }
        return `http://${hostname}:5000/api`;
    }

    // Production/hosted default: same-origin /api (works over HTTPS without hardcoded localhost:5000).
    if (hasWindow && window.location?.origin) {
        return `${window.location.origin}/api`;
    }

    return "http://localhost:5000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const FRONTEND_BASE_URL = hasWindow && window.location?.origin
    ? window.location.origin
    : `http://${hostname}:3000`;

export const API_ENDPOINTS = Object.freeze({
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me"
});
