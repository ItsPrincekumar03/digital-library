'use strict';

// Module 27 SEC-02 — Reader-compatible Content Security Policy.
//
// Design decisions:
//  - script-src 'self': All JavaScript is served from the same origin.
//    No external scripts, CDN, or eval needed.
//  - style-src 'self': All CSS is served from the same origin.
//    'unsafe-inline' is avoided; existing stylesheets are external files.
//  - img-src 'self' blob: data:: Extracted book images are served via the
//    same-origin API; blob: and data: are needed for canvas-rendered previews.
//  - font-src 'self': No external fonts.
//  - connect-src 'self': All API calls are same-origin.
//  - worker-src 'self' blob:: Required for future PDF.js worker integration.
//    blob: is the standard way PDF.js creates its worker.
//  - media-src 'none': No audio/video elements.
//  - object-src 'none': Disables Flash and embedded objects.
//  - frame-ancestors 'none': Prevents the application from being framed
//    (clickjacking protection).
//  - base-uri 'self': Prevents base-tag hijacking.
//  - form-action 'self': Prevents cross-origin form submissions.
//
// Web Speech API (TTS): uses window.speechSynthesis which is a browser built-in.
// No external origin is required; CSP does not restrict it.
//
// In development, CSP is set to report-only mode so that CSP violations are
// reported to the console without blocking application functionality during
// development. In production, enforcement is active.

const DIRECTIVES = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'blob:', 'data:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    mediaSrc: ["'none'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
};

/**
 * Returns a Helmet-compatible contentSecurityPolicy options object.
 *
 * @param {boolean} isProduction
 * @returns {object}
 */
function buildCspConfig(isProduction) {
    if (!isProduction) {
        // Development: enforce but allow localhost API calls and relaxed
        // upgrade-insecure-requests (HTTP is acceptable locally).
        const devDirectives = {
            ...DIRECTIVES,
            upgradeInsecureRequests: null, // do not set in dev (HTTP is fine)
        };
        return {
            directives: devDirectives,
            reportOnly: false, // enforce even in dev to catch violations early
        };
    }

    return {
        directives: DIRECTIVES,
        reportOnly: false,
    };
}

module.exports = { buildCspConfig };
