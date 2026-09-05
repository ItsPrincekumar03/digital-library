require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
    // Verify DB connectivity before accepting traffic.
    const dbStatus = await testConnection();

    if (!dbStatus.success) {
        logger.error('Startup aborted: could not connect to MySQL.', dbStatus.error);
        process.exit(1);
    }

    logger.info(dbStatus.message);

    app.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
    });
}

startServer();