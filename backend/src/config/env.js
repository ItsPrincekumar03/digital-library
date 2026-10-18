const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

let isLoaded = false;

function loadEnv() {
    if (isLoaded) return;

    const candidates = [
        path.resolve(__dirname, '../../.env'),     // backend/.env
        path.resolve(process.cwd(), '.env'),       // current working directory
        path.resolve(__dirname, '../../../.env'),  // root .env
    ];

    for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            isLoaded = true;
            return;
        }
    }

    dotenv.config();
    isLoaded = true;
}

loadEnv();

module.exports = { loadEnv };
