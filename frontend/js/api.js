import { API_BASE_URL } from "./config.js";

export class ApiError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

function getErrorMessage(payload, fallback) {
    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (payload && typeof payload === "object") {
        if (
            typeof payload.message === "string" &&
            payload.message.trim()
        ) {
            return payload.message;
        }

        if (
            typeof payload.error === "string" &&
            payload.error.trim()
        ) {
            return payload.error;
        }

        if (
            payload.errors &&
            typeof payload.errors === "object"
        ) {
            const firstError = Object.values(payload.errors).flat()[0];

            if (typeof firstError === "string") {
                return firstError;
            }
        }
    }

    return fallback;
}

async function readResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    const text = await response.text().catch(() => "");

    return text || null;
}

export const api = {

    async request(path, options = {}) {
        const headers = new Headers(
            options.headers || {}
        );

        const requestOptions = {
            ...options,
            headers,

            // Browser handles HTTP-only authentication cookie.
            credentials: "include"
        };

        if (
            options.body !== undefined &&
            options.body !== null &&
            !(options.body instanceof FormData) &&
            typeof options.body !== "string"
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );

            requestOptions.body =
                JSON.stringify(options.body);
        }

        let response;

        try {
            response = await fetch(
                `${API_BASE_URL}${path}`,
                requestOptions
            );
        } catch (error) {
            throw new ApiError(
                "Could not connect to the server. Check that the backend is running.",
                0,
                error
            );
        }

        const payload =
            await readResponse(response);

        if (!response.ok) {
            throw new ApiError(
                getErrorMessage(
                    payload,
                    `Request failed (${response.status}).`
                ),
                response.status,
                payload
            );
        }

        return payload;
    },

    get(path) {
        return this.request(path, {
            method: "GET"
        });
    },

    post(path, body) {
        return this.request(path, {
            method: "POST",
            body
        });
    }

};