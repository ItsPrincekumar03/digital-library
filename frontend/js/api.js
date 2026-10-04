import { API_BASE_URL } from "./config.js";

export class ApiError extends Error {
    constructor(
        message,
        status = 0,
        details = null
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

function getErrorMessage(
    payload,
    fallback
) {
    if (
        typeof payload === "string" &&
        payload.trim()
    ) {
        return payload;
    }

    if (
        payload &&
        typeof payload === "object"
    ) {
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
            Array.isArray(payload.errors) &&
            payload.errors.length
        ) {
            const firstError =
                payload.errors[0];

            if (
                typeof firstError === "string"
            ) {
                return firstError;
            }

            if (
                firstError &&
                typeof firstError.message === "string" &&
                firstError.message.trim()
            ) {
                return firstError.message;
            }

            if (
                firstError &&
                typeof firstError.msg === "string" &&
                firstError.msg.trim()
            ) {
                return firstError.msg;
            }
        }

        if (
            payload.errors &&
            typeof payload.errors === "object"
        ) {
            const values =
                Object.values(payload.errors);

            const flattened =
                values.flat();

            const firstError =
                flattened[0];

            if (
                typeof firstError === "string" &&
                firstError.trim()
            ) {
                return firstError;
            }

            if (
                firstError &&
                typeof firstError.message === "string" &&
                firstError.message.trim()
            ) {
                return firstError.message;
            }
        }
    }

    return fallback;
}

async function readResponse(
    response
) {
    if (response.status === 204) {
        return null;
    }

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType
            .toLowerCase()
            .includes("application/json")
    ) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    const text =
        await response
            .text()
            .catch(() => "");

    return text || null;
}

export const api = {
    async request(
        path,
        options = {}
    ) {
        const headers =
            new Headers(
                options.headers || {}
            );

        const requestOptions = {
            ...options,
            headers,

            // HTTP-only authentication cookie
            // is handled automatically by the browser.
            credentials: "include"
        };

        /*
         * Automatically convert normal JavaScript
         * objects into JSON.
         *
         * FormData is intentionally left untouched so
         * upload functionality can use it later.
         */
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
                JSON.stringify(
                    options.body
                );
        }

        let response;

        try {
            response =
                await fetch(
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
            await readResponse(
                response
            );

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
        return this.request(
            path,
            {
                method: "GET"
            }
        );
    },

    post(
        path,
        body
    ) {
        return this.request(
            path,
            {
                method: "POST",
                body
            }
        );
    },

    put(
        path,
        body
    ) {
        return this.request(
            path,
            {
                method: "PUT",
                body
            }
        );
    },

    patch(
        path,
        body
    ) {
        return this.request(
            path,
            {
                method: "PATCH",
                body
            }
        );
    },

    delete(
        path
    ) {
        return this.request(
            path,
            {
                method: "DELETE"
            }
        );
    }
};