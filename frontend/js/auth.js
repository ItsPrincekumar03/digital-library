import { api, ApiError } from "./api.js";
import { API_ENDPOINTS } from "./config.js";

let currentUser = null;
let initialized = false;

function looksLikeUser(value) {
    return Boolean(
        value &&
        typeof value === "object" &&
        (
            value.id !== undefined ||
            value.userId !== undefined ||
            value.user_id !== undefined ||
            value.email !== undefined ||
            value.name !== undefined ||
            value.fullName !== undefined ||
            value.full_name !== undefined
        )
    );
}

function extractUser(payload) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const candidates = [
        payload.user,
        payload.data?.user,
        payload.data?.data?.user,
        payload.data,
        payload
    ];

    return (
        candidates.find(looksLikeUser) || null
    );
}

/*
 * Normalize different possible backend field names
 * into one frontend role property.
 *
 * Existing backend may return:
 *
 * role
 * role.name
 * role_name
 *
 * The frontend converts ADMIN into:
 *
 * role: "ADMIN"
 *
 * and everything else into:
 *
 * role: "USER"
 */
function normalizeUser(user) {
    if (!user) {
        return null;
    }

    const rawRole =
        typeof user.role === "string"
            ? user.role

            : typeof user.role?.name === "string"
                ? user.role.name

                : typeof user.role_name === "string"
                    ? user.role_name

                    : "USER";

    const normalizedRole =
        String(rawRole).toUpperCase() === "ADMIN"
            ? "ADMIN"
            : "USER";

    return {
        ...user,
        role: normalizedRole
    };
}

export const auth = {

    async refresh() {
        try {
            const payload =
                await api.get(API_ENDPOINTS.me);

            currentUser =
                normalizeUser(
                    extractUser(payload)
                );

        } catch (error) {

            if (
                error instanceof ApiError &&
                error.status === 401
            ) {
                currentUser = null;
                api.clearToken();
            } else {
                throw error;
            }
        }

        initialized = true;

        return currentUser;
    },

    async init() {
        if (!initialized) {
            await this.refresh();
        }

        return currentUser;
    },

    getUser() {
        return currentUser;
    },

    isAuthenticated() {
        return Boolean(currentUser);
    },

    isAdmin() {
        return currentUser?.role === "ADMIN";
    },

    async login(credentials) {
        const payload = await api.post(
            API_ENDPOINTS.login,
            credentials
        );

        const token = payload?.data?.token || payload?.token;
        if (token) {
            api.setToken(token);
        }

        const userFromLogin = normalizeUser(extractUser(payload));
        if (userFromLogin) {
            currentUser = userFromLogin;
        }

        initialized = false;

        try {
            const refreshed = await this.refresh();
            if (refreshed) {
                return refreshed;
            }
        } catch (_) {
            // If the immediate verification request has a transient issue,
            // fall back to the user object directly returned by successful login.
        }

        if (currentUser) {
            initialized = true;
            return currentUser;
        }

        return this.refresh();
    },

    async register(details) {
        return api.post(
            API_ENDPOINTS.register,
            details
        );
    },

    async logout() {
        try {
            await api.post(
                API_ENDPOINTS.logout,
                {}
            );
        } finally {
            api.clearToken();
            currentUser = null;
            initialized = true;
        }
    }

};
