require("dotenv").config();

const { API_PORT, HOST } = process.env;

const downloadsRoutes = require('./routes/downloads.routes.js');
const healthcheckRoutes = require('./routes/healthcheck.routes.js');

const stats = require('./services/stats.js');

const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const express = require('express');
const app = express();
const router = express.Router();
const cors = require('cors');

const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format');
const healthCheckModule = require("./routes/healthcheck.routes.js");

const logger = winston.createLogger({
    format: ecsFormat(),
    transports: [
        new winston.transports.Console()
    ]
});

const whitelist = [
    'http://nas.thorez.loc',
    'http://nas.thorez.net',
    'http://rack.thorez.net:3000',
    'http://rack.thorez.loc:3000',
    'http://localhost:3000',
    'http://localhost:4200',
    'http://nas.thorez.loc',
    'http://nas.thorez.net'];

const corsOptions = {
    origin: function (origin, callback) {
        logger.info(origin)
        if (!origin || whitelist.indexOf(origin) !== -1) {
            logger.info('accepted');
            callback(null, true)
        } else {
            logger.info('refused');
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(cors(corsOptions));


app.use(express.json());

router.route('/healthcheck')
    .get(healthCheckModule.getHealthCheck);

router.route('/downloads')
    .post(downloadsRoutes.addDownload)
    .get(downloadsRoutes.getAllDownloads)
    .put(downloadsRoutes.updateStatus)
    ;

router.route('/stats')
    .get(stats.statReport)
    ;

router.route('/temperature')
    .get(stats.temperature)
    ;

swaggerDocument.host = `${HOST}`

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);

const server = app.listen(API_PORT);