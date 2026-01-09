const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 8080,
    path: '/ebk/health',
    timeout: 5000,
    headers: {
        'User-Agent': 'Docker-Health-Check/1.0'
    }
};

const req = http.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);

    // Accept 200-399 as healthy
    if (res.statusCode >= 200 && res.statusCode < 400) {
        process.exit(0);
    } else {
        console.error(`Health check failed with status: ${res.statusCode}`);
        process.exit(1);
    }
});

req.on('error', (err) => {
    console.error('Health check error:', err.message);
    process.exit(1);
});

req.end();