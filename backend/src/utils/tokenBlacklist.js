// Minimal in-memory blacklist so a logged-out token is rejected
// even if it hasn't expired yet.
//
// LIMITATION: this resets if the server restarts, and won't work
// across multiple server instances. For a production system you'd
// move this to Redis or a DB table — fine for this project's scope.

const blacklist = new Set();

function add(token) {
    blacklist.add(token);
}

function isBlacklisted(token) {
    return blacklist.has(token);
}

module.exports = { add, isBlacklisted };