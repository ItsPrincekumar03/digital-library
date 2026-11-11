import { API_BASE_URL } from "./config.js";
import { api } from "./api.js";

function resolveApiOrigin() {
    return new URL(API_BASE_URL, typeof window !== "undefined" ? window.location.href : "http://localhost:5000").origin;
}

function isInvalidLocalCoverPath(trimmed) {
    return (
        trimmed.startsWith("/uploads/") ||
        trimmed.startsWith("uploads/") ||
        /^[A-Za-z]:[\\/]/.test(trimmed) ||
        /^\\\\/.test(trimmed) ||
        /^\/(Users|home|var|etc|tmp|mnt|root)\//.test(trimmed)
    );
}

export function resolveCoverRequestUrl(coverPath, fallbackApiPath) {
    const fallbackUrl = fallbackApiPath
        ? new URL(`/api${fallbackApiPath.startsWith("/") ? fallbackApiPath : `/${fallbackApiPath}`}`, resolveApiOrigin()).href
        : null;

    if (typeof coverPath !== "string" || !coverPath.trim()) {
        return { url: fallbackUrl, isApi: Boolean(fallbackUrl), fallbackUrl };
    }

    const trimmed = coverPath.trim();

    if (isInvalidLocalCoverPath(trimmed)) {
        return { url: fallbackUrl, isApi: Boolean(fallbackUrl), fallbackUrl };
    }

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const apiOrigin = resolveApiOrigin();
            return {
                url: parsed.href,
                isApi: parsed.origin === apiOrigin && parsed.pathname.startsWith("/api/"),
                fallbackUrl,
            };
        } catch {
            return { url: fallbackUrl, isApi: Boolean(fallbackUrl), fallbackUrl };
        }
    }

    try {
        const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
        const url = new URL(normalized, resolveApiOrigin());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return { url: fallbackUrl, isApi: Boolean(fallbackUrl), fallbackUrl };
        }
        return {
            url: url.href,
            isApi: url.pathname.startsWith("/api/"),
            fallbackUrl,
        };
    } catch {
        return { url: fallbackUrl, isApi: Boolean(fallbackUrl), fallbackUrl };
    }
}

async function fetchCoverAsBlobUrl(url) {
    const headers = {};
    const token = api.getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        credentials: "include",
        headers,
    });

    if (!response.ok) {
        throw new Error(`Cover request failed (${response.status}).`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
        throw new Error("Unexpected cover content type.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

/**
 * Loads a cover image cleanly into `image` with graceful fallback to
 * `fallbackApiPath` (authenticated API cover/SVG fallback) and finally
 * `placeholder`. Never leaves a broken <img> icon visible.
 */
export async function loadCoverIntoElements(
    image,
    placeholder,
    { coverPath = "", fallbackApiPath = "", altText = "Book cover" } = {}
) {
    if (!image || !placeholder) {
        return;
    }

    if (image.dataset.blobUrl) {
        try {
            URL.revokeObjectURL(image.dataset.blobUrl);
        } catch (_) {}
        delete image.dataset.blobUrl;
    }

    const requestToken = String((Number(image.dataset.coverReq || "0") || 0) + 1);
    image.dataset.coverReq = requestToken;
    image.loading = "eager";
    image.hidden = true;
    placeholder.hidden = false;

    const showPlaceholder = () => {
        if (image.dataset.coverReq !== requestToken) return;
        image.hidden = true;
        image.removeAttribute("src");
        placeholder.hidden = false;
    };

    const showImageUrl = (srcUrl, isBlob = false) => {
        if (image.dataset.coverReq !== requestToken) {
            if (isBlob) URL.revokeObjectURL(srcUrl);
            return;
        }
        if (isBlob) {
            image.dataset.blobUrl = srcUrl;
        }
        image.loading = "eager";
        image.alt = altText || "Book cover";
        image.onload = () => {
            if (image.dataset.coverReq !== requestToken) return;
            image.hidden = false;
            placeholder.hidden = true;
        };
        image.onerror = () => {
            if (isBlob) {
                try { URL.revokeObjectURL(srcUrl); } catch (_) {}
                delete image.dataset.blobUrl;
            }
            showPlaceholder();
        };
        image.src = srcUrl;
        if (image.complete && image.naturalWidth > 0) {
            image.hidden = false;
            placeholder.hidden = true;
        }
    };

    const { url, isApi, fallbackUrl } = resolveCoverRequestUrl(coverPath, fallbackApiPath);
    if (!url) {
        showPlaceholder();
        return;
    }

    try {
        if (isApi) {
            const blobUrl = await fetchCoverAsBlobUrl(url);
            showImageUrl(blobUrl, true);
            return;
        }

        // External explicit URL: render directly and fall back to API cover if blocked/404.
        if (image.dataset.coverReq !== requestToken) return;
        image.loading = "eager";
        image.alt = altText || "Book cover";
        image.onload = () => {
            if (image.dataset.coverReq !== requestToken) return;
            image.hidden = false;
            placeholder.hidden = true;
        };
        image.onerror = async () => {
            if (image.dataset.coverReq !== requestToken) return;
            if (fallbackUrl && fallbackUrl !== url) {
                try {
                    const fbBlob = await fetchCoverAsBlobUrl(fallbackUrl);
                    showImageUrl(fbBlob, true);
                    return;
                } catch (_) {}
            }
            showPlaceholder();
        };
        image.src = url;
    } catch {
        if (fallbackUrl && fallbackUrl !== url) {
            try {
                const fbBlob = await fetchCoverAsBlobUrl(fallbackUrl);
                showImageUrl(fbBlob, true);
                return;
            } catch (_) {}
        }
        showPlaceholder();
    }
}
