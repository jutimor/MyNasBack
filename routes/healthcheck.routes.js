

var getHealthCheck = function (_req, res, _next) {
    // optional: add further things to check (e.g. connecting to dababase)
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.send(healthcheck);
    } catch (e) {
        healthcheck.message = e;
        res.status(503).send();
    }
};

var healthCheckModule = {
    getHealthCheck
}

module.exports = healthCheckModule;