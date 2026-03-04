module.exports = {
    apps: [
        {
            name: 'c3-server',
            script: 'server/index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: 'logs/error.log',
            out_file: 'logs/output.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        },
    ],
};
